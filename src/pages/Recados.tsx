import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Search, Plus, Pin, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Role = 'admin' | 'tripulante' | 'financeiro' | 'financeiro_master' | 'operacoes' | 'ctm' | 'piloto_chefe' | 'cotista' | 'gestor_master' | 'operador';
type TargetType = 'user' | 'role' | 'all';

interface Message {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string | null;
  content: string;
  target_type: string;
  is_pinned: boolean;
  created_at: string;
  is_read: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: Role[];
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  tripulante: 'Tripulante',
  financeiro: 'Financeiro',
  financeiro_master: 'Financeiro Master',
  operacoes: 'Operações',
  ctm: 'CTM',
  piloto_chefe: 'Piloto Chefe',
  cotista: 'Cotista',
  gestor_master: 'Gestor Master',
  operador: 'Operador'
};

export default function Recados() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [targetRoles, setTargetRoles] = useState<Role[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadMessages();

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*');

    if (!profiles) return;

    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);

        return {
          ...profile,
          roles: roleData?.map(r => r.role) || []
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    if (!data) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const messagesWithReadStatus = await Promise.all(
      data.map(async (msg) => {
        const { data: readData } = await supabase
          .from('message_reads')
          .select('id')
          .eq('message_id', msg.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          id: msg.id,
          author_id: msg.author_id,
          author_name: msg.author_name,
          author_role: msg.author_role,
          content: msg.content,
          target_type: msg.target_type,
          is_pinned: msg.is_pinned,
          created_at: msg.created_at,
          is_read: !!readData
        } as Message;
      })
    );

    setMessages(messagesWithReadStatus);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', currentUserId)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId)
        .limit(1)
        .maybeSingle();

      const messageData: any = {
        author_id: currentUserId,
        author_name: profile?.full_name || 'Usuário',
        author_role: roleData?.role || null,
        content: newMessage,
        target_type: targetType,
        is_pinned: isPinned
      };

      if (targetType === 'user' && targetUserId) {
        messageData.target_user_id = targetUserId;
      } else if (targetType === 'role' && targetRoles.length > 0) {
        messageData.target_roles = targetRoles;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      toast.success('Recado enviado com sucesso!');
      setNewMessage("");
      setTargetType('all');
      setTargetUserId("");
      setTargetRoles([]);
      setIsPinned(false);
      loadMessages();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar recado');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('message_reads')
      .insert({ message_id: messageId, user_id: currentUserId });

    if (!error) loadMessages();
  };

  const handleTogglePin = async (messageId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: !currentPinned })
      .eq('id', messageId);

    if (!error) {
      toast.success(currentPinned ? 'Recado desafixado' : 'Recado fixado');
      loadMessages();
    }
  };

  const handleToggleRole = (role: Role) => {
    setTargetRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const filteredMessages = messages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const unreadCount = messages.filter(m => !m.is_read).length;
  const pinnedCount = messages.filter(m => m.is_pinned).length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recados</h1>
            <p className="text-muted-foreground mt-2">
              Central de comunicação interna da equipe
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Recado
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recados da Equipe
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar recados..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum recado encontrado
                </p>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border border-border rounded-lg hover:bg-accent transition-colors ${!message.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(message.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{message.author_name}</h4>
                          {message.author_role && (
                            <Badge variant="outline" className="text-xs">
                              {ROLE_LABELS[message.author_role as Role] || message.author_role}
                            </Badge>
                          )}
                          {message.is_pinned && (
                            <Pin className="h-3 w-3 text-yellow-600" />
                          )}
                          {!message.is_read && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground mb-2">{message.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </div>
                          <div className="flex gap-2">
                            {!message.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                Marcar como lido
                              </Button>
                            )}
                            {currentUserId === message.author_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePin(message.id, message.is_pinned)}
                              >
                                {message.is_pinned ? 'Desafixar' : 'Fixar'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Recado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Destinatário</Label>
                  <Select value={targetType} onValueChange={(value: TargetType) => setTargetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      <SelectItem value="role">Grupo específico</SelectItem>
                      <SelectItem value="user">Usuário específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetType === 'user' && (
                  <div className="space-y-2">
                    <Label>Selecione o usuário</Label>
                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {targetType === 'role' && (
                  <div className="space-y-2">
                    <Label>Selecione os grupos</Label>
                    <div className="space-y-2">
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={role}
                            checked={targetRoles.includes(role as Role)}
                            onCheckedChange={() => handleToggleRole(role as Role)}
                          />
                          <Label htmlFor={role} className="cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite sua mensagem..."
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fixar"
                    checked={isPinned}
                    onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                  />
                  <Label htmlFor="fixar" className="cursor-pointer">
                    Fixar recado
                  </Label>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Enviando..." : "Enviar Recado"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Recados</span>
                    <span className="font-semibold">28</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Não Lidos</span>
                    <Badge className="bg-red-100 text-red-800">{unreadCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fixados</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{pinnedCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">{messages.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}