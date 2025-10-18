import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMessageNotifications = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

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
          const isForMe = await checkIfMessageIsForUser(newMessage, currentUserId);
          
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
  }, [currentUserId]);
};

async function checkIfMessageIsForUser(message: any, userId: string): Promise<boolean> {
  // Message for all users
  if (message.target_type === 'all') return true;

  // Message for specific user
  if (message.target_type === 'user' && message.target_user_id === userId) {
    return true;
  }

  // Message for specific roles
  if (message.target_type === 'role' && message.target_roles && message.target_roles.length > 0) {
    // Avoid RLS recursion on user_roles by using roles from AuthContext (JWT metadata-backed)
    try {
      const { roles } = await import("@/contexts/AuthContext").then(m => m.useAuth());
      const userRolesList = roles ?? [];
      return message.target_roles.some((role: any) => userRolesList.includes(role));
    } catch (_) {
      return false;
    }
  }

  return false;
}
