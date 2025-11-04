import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create regular client to check permissions
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check if user has permission (admin, gestor_master, or financeiro_master)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => 
      ['admin', 'gestor_master', 'financeiro_master'].includes(r.role)
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data from request
    const { email, password, role, userType, profileData, clientId } = await req.json();

    // Create user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role to the new user
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(
          JSON.stringify({ error: 'Erro ao atribuir role ao usuário' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create user profile or client based on userType
    try {
      if (userType === 'colaborador' && profileData) {
        // Create user profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: newUser.user.id,
            email: profileData.email || email,
            full_name: profileData.full_name,
            phone: profileData.phone,
            birth_date: profileData.birth_date,
            address: profileData.address,
            company_start_date: profileData.company_start_date,
            cpf: profileData.cpf,
            rg: profileData.rg,
            canac: profileData.canac,
            department: profileData.department,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar perfil do usuário' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If role is tripulante or piloto_chefe, also create crew_member
        if (role === 'tripulante' || role === 'piloto_chefe') {
          const { error: crewError } = await supabaseAdmin
            .from('crew_members')
            .insert({
              user_id: newUser.user.id,
              full_name: profileData.full_name,
              canac: profileData.canac,
              email: profileData.email,
              phone: profileData.phone,
              birth_date: profileData.birth_date,
            });

          if (crewError) {
            console.error('Error creating crew member:', crewError);
          }
        }
      } else if (userType === 'cliente' && clientId) {
        // Get client data
        const { data: clientData, error: clientFetchError } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientFetchError || !clientData) {
          console.error('Error fetching client:', clientFetchError);
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Cliente não encontrado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user profile with client data
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: newUser.user.id,
            email: clientData.email || email,
            full_name: clientData.company_name,
            phone: clientData.phone,
            address: clientData.address,
          });

        if (profileError) {
          console.error('Error creating client profile:', profileError);
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar perfil do cliente' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (error) {
      console.error('Error in profile creation:', error);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar dados do perfil' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', newUser.user.email);

    return new Response(
      JSON.stringify({ user: newUser.user, message: 'Usuário criado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
