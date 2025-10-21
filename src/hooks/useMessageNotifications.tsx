import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useMessageNotifications = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { roles } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !currentUserId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Don't notify if the current user is the author
          if (newMessage.author_id === currentUserId) return;

          // Check if message is for current user
          const isForMe = await checkIfMessageIsForUser(newMessage, currentUserId, roles ?? []);

          if (isForMe) {
            toast.info(newMessage.author_name, {
              description: newMessage.content,
              duration: 5000,
              action: {
                label: 'Ver',
                onClick: () => window.location.href = '/recados'
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, roles]);
};

async function checkIfMessageIsForUser(message: any, userId: string, userRolesList: string[]): Promise<boolean> {
  // Message for all users
  if (message.target_type === 'all') return true;

  // Message for specific user
  if (message.target_type === 'user' && message.target_user_id === userId) {
    return true;
  }

  // Message for specific roles
  if (message.target_type === 'role' && message.target_roles && message.target_roles.length > 0) {
    return message.target_roles.some((role: any) => userRolesList.includes(role));
  }

  return false;
}
