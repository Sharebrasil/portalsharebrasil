import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Save, Trash2, User as UserIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserProfile } from "@/hooks/useUserProfile";
import type { AppRole } from "@/lib/roles";

type ContactType = Exclude<UserProfile["tipo"], null>;

type FormState = {
  full_name: string;
  display_name: string;
  phone: string;
  address: string;
  tipo: ContactType | "";
};

const contactTypeOptions: { value: ContactType; label: string }[] = [
  { value: "Colaboradores", label: "Colaboradores" },
  { value: "Clientes", label: "Clientes" },
  { value: "Fornecedores", label: "Fornecedores" },
  { value: "Hoteis", label: "Hotéis" },
];

const USER_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  piloto_chefe: "Piloto Chefe",
  tripulante: "Tripulante",
  financeiro: "Financeiro",
  financeiro_master: "Financeiro Master",
  operacoes: "Operações",
};

const getInitials = (input: string | null | undefined) => {
  if (!input) {
    return "";
  }

  const parts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return input.slice(0, 2).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

const sanitizePhone = (value: string) => value.replace(/\D/g, "");

const buildAvatarPath = (userId: string, fileName: string) => {
  const extension = fileName.split(".").pop();
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return extension ? `${userId}/${uniqueId}.${extension}` : `${userId}/${uniqueId}`;
};

const formatTimestamp = (isoDate: string | null | undefined) => {
  if (!isoDate) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoDate));
  } catch (error) {
    console.error("Failed to format date", error);
    return null;
  }
};

const AVATAR_CROP_BOX_SIZE = 256;
const AVATAR_OUTPUT_SIZE = 512;
const DEFAULT_CROP_SCALE = 1;

export default function Perfil() {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const { profile, isLoading, isFetching, updateProfile, isUpdating } = useUserProfile(user);
  const [formState, setFormState] = useState<FormState>({
    full_name: "",
    display_name: "",
    phone: "",
    address: "",
    tipo: "",
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState<number>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImage, setCropImage] = useState<{ file: File; url: string } | null>(null);
  const [cropMeta, setCropMeta] = useState<{ width: number; height: number; baseScale: number } | null>(null);
  const [cropScale, setCropScale] = useState(DEFAULT_CROP_SCALE);
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropDragStart = useRef<{ x: number; y: number } | null>(null);
  const [isCropDragging, setIsCropDragging] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormState({
        full_name: profile.full_name ?? "",
        display_name: profile.display_name ?? "",
        phone: profile.phone != null ? String(profile.phone) : "",
        address: profile.address ?? "",
        tipo: profile.tipo ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    setAvatarPosition(50);
  }, [profile?.avatar_url]);

  useEffect(() => {
    return () => {
      if (cropImage) {
        URL.revokeObjectURL(cropImage.url);
      }
    };
  }, [cropImage]);

  const displayName = useMemo(
    () => formState.display_name || formState.full_name || profile?.full_name || user?.email || "Usuário",
    [formState.display_name, formState.full_name, profile?.full_name, user?.email]
  );

  const primaryRole = useMemo(() => roles[0] ?? null, [roles]);

  const roleLabel = useMemo(() => {
    if (!primaryRole) {
      return "Sem categoria";
    }

    return USER_ROLE_LABELS[primaryRole] ?? primaryRole.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [primaryRole]);

  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const accountUpdatedAt = useMemo(() => formatTimestamp(profile?.updated_at), [profile?.updated_at]);
  const isProfileBusy = isUpdating || avatarUploading;

  const resetCropState = useCallback(() => {
    setCropDialogOpen(false);
    setCropImage(null);
    setCropMeta(null);
    setCropScale(DEFAULT_CROP_SCALE);
    setCropPosition({ x: 0, y: 0 });
    setIsCropDragging(false);
    cropDragStart.current = null;
    cropImageRef.current = null;
  }, []);

  const clampPosition = useCallback(
    (position: { x: number; y: number }, scaleOverride?: number) => {
      if (!cropMeta) {
        return position;
      }

      const scale = scaleOverride ?? cropScale;
      const scaledWidth = cropMeta.width * cropMeta.baseScale * scale;
      const scaledHeight = cropMeta.height * cropMeta.baseScale * scale;
      const maxOffsetX = Math.max((scaledWidth - AVATAR_CROP_BOX_SIZE) / 2, 0);
      const maxOffsetY = Math.max((scaledHeight - AVATAR_CROP_BOX_SIZE) / 2, 0);

      return {
        x: Math.min(Math.max(position.x, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(position.y, -maxOffsetY), maxOffsetY),
      };
    },
    [cropMeta, cropScale]
  );

  const handleCropPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropMeta) {
      return;
    }

    event.preventDefault();
    setIsCropDragging(true);
    cropDragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [cropMeta]);

  const handleCropPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isCropDragging || !cropDragStart.current) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - cropDragStart.current.x;
    const deltaY = event.clientY - cropDragStart.current.y;
    cropDragStart.current = { x: event.clientX, y: event.clientY };

    setCropPosition((prev) => clampPosition({ x: prev.x + deltaX, y: prev.y + deltaY }));
  }, [clampPosition, isCropDragging]);

  const handleCropPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsCropDragging(false);
    cropDragStart.current = null;
  }, []);

  const handleScaleChange = useCallback((value: number[]) => {
    const newScale = value[0] ?? DEFAULT_CROP_SCALE;
    setCropScale(newScale);
    setCropPosition((prev) => clampPosition(prev, newScale));
  }, [clampPosition]);

  const handleCropImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) {
      return;
    }

    const baseScale = Math.max(AVATAR_CROP_BOX_SIZE / naturalWidth, AVATAR_CROP_BOX_SIZE / naturalHeight);
    setCropMeta({ width: naturalWidth, height: naturalHeight, baseScale });
    setCropScale(DEFAULT_CROP_SCALE);
    setCropPosition({ x: 0, y: 0 });
  }, []);

  const uploadAvatarFile = useCallback(async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Usuário não encontrado",
        description: "Faça login novamente para atualizar a foto de perfil.",
        variant: "destructive",
      });
      return false;
    }

    setAvatarUploading(true);

    try {
      const path = buildAvatarPath(user.id, file.name);
      const { error: uploadError } = await supabase.storage
        .from("profile-avatar")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from("profile-avatar")
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error("Não foi possível gerar a URL da imagem.");
      }

      await updateProfile({ avatar_url: publicData.publicUrl });

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a foto.";
      toast({
        title: "Não foi possível enviar a foto",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setAvatarUploading(false);
    }
  }, [toast, updateProfile, user?.id]);

  const handleConfirmCrop = useCallback(async () => {
    if (!cropImage || !cropMeta) {
      return;
    }

    const imageElement = cropImageRef.current;
    if (!imageElement) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;
    const context = canvas.getContext("2d");

    if (!context) {
      toast({
        title: "Erro ao preparar a imagem",
        description: "Não foi possível processar a imagem selecionada.",
        variant: "destructive",
      });
      return;
    }

    const scaleMultiplier = cropMeta.baseScale * cropScale;
    const ratio = AVATAR_OUTPUT_SIZE / AVATAR_CROP_BOX_SIZE;
    const { x, y } = cropPosition;
    const drawWidth = cropMeta.width * scaleMultiplier * ratio;
    const drawHeight = cropMeta.height * scaleMultiplier * ratio;
    const drawX = (AVATAR_OUTPUT_SIZE - drawWidth) / 2 + x * ratio;
    const drawY = (AVATAR_OUTPUT_SIZE - drawHeight) / 2 + y * ratio;

    const preferredMime = cropImage.file.type === "image/png" ? "image/png" : "image/jpeg";
    context.clearRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
    if (preferredMime === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
    }
    context.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, preferredMime, preferredMime === "image/jpeg" ? 0.92 : undefined)
    );

    if (!blob) {
      toast({
        title: "Erro ao gerar a imagem",
        description: "Não foi possível finalizar o corte da foto.",
        variant: "destructive",
      });
      return;
    }

    const extension = preferredMime === "image/png" ? "png" : "jpg";
    const baseName = cropImage.file.name.replace(/\.[^.]+$/, "");
    const croppedFile = new File([blob], `${baseName}.${extension}`, { type: preferredMime });

    const success = await uploadAvatarFile(croppedFile);
    if (success) {
      resetCropState();
    }
  }, [cropImage, cropMeta, cropPosition, cropScale, resetCropState, toast, uploadAvatarFile]);

  const handleCancelCrop = useCallback(() => {
    if (avatarUploading) {
      return;
    }
    resetCropState();
  }, [avatarUploading, resetCropState]);

  const handleCropDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      if (avatarUploading) {
        return;
      }
      resetCropState();
    } else {
      setCropDialogOpen(true);
    }
  }, [avatarUploading, resetCropState]);

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: field === "phone" ? sanitizePhone(value) : value,
    }));
  };

  const handleSelectChange = (value: ContactType) => {
    setFormState((prev) => ({
      ...prev,
      tipo: value,
    }));
  };

  const handleSave = async () => {
    const trimmedFullName = formState.full_name.trim();

    if (!trimmedFullName) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome completo para salvar o perfil.",
        variant: "destructive",
      });
      return;
    }

    const phoneDigits = formState.phone ? String(formState.phone) : null;

    try {
      await updateProfile({
        full_name: trimmedFullName,
        display_name: formState.display_name.trim() || null,
        phone: phoneDigits,
        address: formState.address.trim() || null,
        tipo: formState.tipo || null,
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar o perfil.";
      toast({
        title: "Não foi possível atualizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || avatarUploading) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCropImage({ file, url: previewUrl });
    setCropDialogOpen(true);
    setCropMeta(null);
    setCropScale(DEFAULT_CROP_SCALE);
    setCropPosition({ x: 0, y: 0 });
    setIsCropDragging(false);
  };

  const handleAvatarDelete = async () => {
    if (!user?.id || !profile?.avatar_url) {
      return;
    }

    setAvatarUploading(true);

    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(profile.avatar_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('profile-avatar') + 1).join('/');

      // Deletar o arquivo do storage
      const { error: deleteError } = await supabase.storage
        .from("profile-avatar")
        .remove([filePath]);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar o perfil removendo a URL do avatar
      await updateProfile({ avatar_url: null });

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida com sucesso.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover a foto.";
      toast({
        title: "Não foi possível remover a foto",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const triggerFileDialog = () => {
    if (!isProfileBusy) {
      fileInputRef.current?.click();
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Não foi possível carregar as informações do usuário autenticado.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Dialog open={cropDialogOpen} onOpenChange={handleCropDialogOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajustar foto de perfil</DialogTitle>
            <DialogDescription>
              Arraste a imagem e utilize a régua para escolher o melhor enquadramento antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <div
                className="relative h-64 w-64 overflow-hidden rounded-full border-2 border-primary bg-muted shadow-lg"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                style={{ touchAction: 'none' }}
              >
                {cropImage?.url ? (
                  <div
                    className={`absolute inset-0 ${isCropDragging ? "cursor-grabbing" : "cursor-grab"}`}
                  >
                    <img
                      ref={(node) => {
                        cropImageRef.current = node;
                      }}
                      src={cropImage.url}
                      alt="Pré-visualização do avatar"
                      onLoad={handleCropImageLoad}
                      draggable={false}
                      className="pointer-events-none absolute select-none"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: cropMeta ? `${cropMeta.width * cropMeta.baseScale * cropScale}px` : 'auto',
                        height: cropMeta ? `${cropMeta.height * cropMeta.baseScale * cropScale}px` : 'auto',
                        transform: `translate(calc(-50% + ${cropPosition.x}px), calc(-50% + ${cropPosition.y}px))`,
                        maxWidth: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="avatar-scale" className="text-sm font-medium">
                  Ajuste o zoom da imagem
                </Label>
                <span className="text-xs text-muted-foreground">
                  {cropScale.toFixed(2)}x
                </span>
              </div>
              <Slider
                id="avatar-scale"
                min={1}
                max={3}
                step={0.01}
                value={[cropScale]}
                onValueChange={handleScaleChange}
                disabled={!cropMeta || avatarUploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground text-center">
                Arraste a imagem para posicionar e use a régua para ampliar ou reduzir
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCrop} disabled={avatarUploading}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCrop}
              disabled={!cropMeta || avatarUploading}
              className="flex items-center gap-2"
            >
              {avatarUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar corte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie suas informações pessoais e mantenha seus dados sempre atualizados.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isProfileBusy || isFetching || isLoading}>
            {isProfileBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage
                    src={profile?.avatar_url ?? undefined}
                    alt={displayName}
                    className="h-full w-full object-cover transition-[object-position] duration-200"
                    style={{ objectPosition: `center ${avatarPosition}%` }}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {avatarInitials || <UserIcon className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="flex gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFileDialog}
                      disabled={avatarUploading}
                      className="flex items-center gap-2"
                    >
                      {avatarUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      Alterar Foto
                    </Button>
                    {profile?.avatar_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarDelete}
                        disabled={avatarUploading}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                    </div>
                  <Badge variant="secondary">{profile?.tipo ? profile.tipo.toUpperCase() : "Sem categoria"}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="text-center text-foreground">
                <p className="font-semibold text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{profile?.email ?? user.email}</p>
              </div>
              {accountUpdatedAt && (
                <p>
                  <span className="font-medium text-foreground">Atualizado em:</span> {accountUpdatedAt}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Nome Completo</Label>
                  <Input
                    id="full-name"
                    value={formState.full_name}
                    onChange={handleInputChange("full_name")}
                    placeholder="Digite seu nome completo"
                    disabled={isLoading || isFetching}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Nome de Exibição</Label>
                  <Input
                    id="display-name"
                    value={formState.display_name}
                    onChange={handleInputChange("display_name")}
                    placeholder="Como você prefere ser chamado(a)?"
                    disabled={isLoading || isFetching}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={profile?.email ?? user.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formState.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="Apenas números"
                    disabled={isLoading || isFetching}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formState.address}
                  onChange={handleInputChange("address")}
                  placeholder="Rua, número, bairro, cidade"
                  rows={3}
                  disabled={isLoading || isFetching}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formState.tipo || undefined}
                  onValueChange={(value) => handleSelectChange(value as ContactType)}
                  disabled={isLoading || isFetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {(isLoading || isFetching) && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando informações do perfil...
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}