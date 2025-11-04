import { useCallback, useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Eye, FileText, Folder, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type FlightDocumentType = "folder" | "file";

type FlightDocumentCategory = "operations" | "documents";

interface FlightDocument {
  id: string;
  name: string;
  type: FlightDocumentType;
  parent_folder_id: string | null;
  category: FlightDocumentCategory;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  caption: string | null;
  created_at: string;
}

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
};

const buildUniqueFileName = (originalName: string) => {
  const extension = originalName.split(".").pop();
  const uniqueId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return extension ? `${uniqueId}.${extension}` : uniqueId;
};

export default function Documentos() {
  const [documents, setDocuments] = useState<FlightDocument[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FlightDocument[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<FlightDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const loadDocuments = useCallback(async () => {
    let query = supabase
      .from("flight_documents")
      .select("*")
      .eq("category", "documents");

    if (currentFolder === null) {
      query = query.is("parent_folder_id", null);
    } else {
      query = query.eq("parent_folder_id", currentFolder);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar documentos");
      return;
    }

    const sortedDocuments = ((data || []) as FlightDocument[]).sort((a, b) => {
      if (a.type !== b.type) {
        return (b.type || '').localeCompare(a.type || '');
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    setDocuments(sortedDocuments);
  }, [currentFolder]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("flight_documents")
      .insert({
        name: newFolderName.trim(),
        type: "folder",
        category: "documents",
        parent_folder_id: currentFolder,
      });

    setLoading(false);

    if (error) {
      toast.error("Erro ao criar pasta");
      return;
    }

    toast.success("Pasta criada com sucesso");
    setNewFolderName("");
    setShowNewFolder(false);
    loadDocuments();
  };

  const handleUploadFile = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setLoading(true);

    const uniqueFileName = buildUniqueFileName(uploadFile.name);
    const filePath = currentFolder ? `${currentFolder}/${uniqueFileName}` : uniqueFileName;

    const { error: uploadError } = await supabase.storage
      .from("flight-documents")
      .upload(filePath, uploadFile);

    if (uploadError) {
      setLoading(false);
      toast.error("Erro ao fazer upload do arquivo");
      return;
    }

    const { error: dbError } = await supabase
      .from("flight_documents")
      .insert({
        name: uploadFile.name,
        type: "file",
        category: "documents",
        parent_folder_id: currentFolder,
        file_url: filePath,
        file_type: uploadFile.type,
        file_size: uploadFile.size,
        caption: uploadCaption.trim() || null,
      });

    setLoading(false);

    if (dbError) {
      toast.error("Erro ao salvar informações do arquivo");
      return;
    }

    toast.success("Arquivo enviado com sucesso");
    setUploadFile(null);
    setUploadCaption("");
    setShowUpload(false);
    loadDocuments();
  };

  const handleOpenFolder = (folder: FlightDocument) => {
    setCurrentFolder(folder.id);
    setFolderPath((prev) => [...prev, folder]);
  };

  const handleGoBack = () => {
    setFolderPath((prev) => {
      const updated = prev.slice(0, -1);
      setCurrentFolder(updated.length > 0 ? updated[updated.length - 1].id : null);
      return updated;
    });
  };

  const handleDeleteDocument = async (doc: FlightDocument) => {
    const isFolder = doc.type === "folder";
    const message = `Deseja excluir ${isFolder ? "a pasta" : "o arquivo"} "${doc.name}"?`;

    if (!window.confirm(message)) {
      return;
    }

    if (doc.type === "file" && doc.file_url) {
      await supabase.storage.from("flight-documents").remove([doc.file_url]);
    }

    const { error } = await supabase
      .from("flight_documents")
      .delete()
      .eq("id", doc.id);

    if (error) {
      toast.error("Erro ao excluir");
      return;
    }

    toast.success("Excluído com sucesso");
    loadDocuments();
  };

  const handleDownloadFile = async (doc: FlightDocument) => {
    if (!doc.file_url) {
      return;
    }

    const { data, error } = await supabase.storage
      .from("flight-documents")
      .download(doc.file_url);

    if (error || !data) {
      toast.error("Erro ao baixar arquivo");
      return;
    }

    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = doc.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleViewFile = async (doc: FlightDocument) => {
    if (!doc.file_url) {
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("flight-documents")
      .getPublicUrl(doc.file_url);

    // Check for publicUrlData.publicUrl directly as getPublicUrl does not return an error object
    if (!publicUrlData?.publicUrl) {
      toast.error("Erro ao visualizar arquivo");
      return;
    }

    setPreviewUrl(publicUrlData.publicUrl);
    setPreviewDoc(doc);
  };

  const handleClosePreview = (open: boolean) => {
    if (!open) {
      setPreviewDoc(null);
      setPreviewUrl("");
    }
  };

  const handleResetToRoot = () => {
    setCurrentFolder(null);
    setFolderPath([]);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground mt-2">Gerencie documentos e arquivos importantes</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            className="cursor-pointer hover:text-foreground"
            onClick={handleResetToRoot}
          >
            Raiz
          </button>
          {folderPath.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-2">
              <span>/</span>
              <button
                type="button"
                className="cursor-pointer hover:text-foreground"
                onClick={() => {
                  const newPath = folderPath.slice(0, index + 1);
                  setFolderPath(newPath);
                  setCurrentFolder(folder.id);
                }}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {currentFolder && (
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowNewFolder((prev) => !prev)}>
            <Folder className="mr-2 h-4 w-4" />
            Nova Pasta
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUpload((prev) => !prev)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>

        {showNewFolder && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <Label htmlFor="new-folder-name">Nome da Pasta</Label>
                <Input
                  id="new-folder-name"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="Digite o nome da pasta"
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreateFolder} disabled={loading}>
                    Criar
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showUpload && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="upload-file">Arquivo</Label>
                  <Input
                    id="upload-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-caption">Legenda (opcional)</Label>
                  <Textarea
                    id="upload-caption"
                    value={uploadCaption}
                    onChange={(event) => setUploadCaption(event.target.value)}
                    placeholder="Adicione uma descrição para o arquivo"
                    rows={2}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleUploadFile} disabled={loading || !uploadFile}>
                    Enviar
                  </Button>
                  <Button variant="outline" onClick={() => setShowUpload(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="p-4 space-y-4">
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 text-left",
                    doc.type === "folder" ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={() => {
                    if (doc.type === "folder") {
                      handleOpenFolder(doc);
                    }
                  }}
                >
                  {doc.type === "folder" ? (
                    <Folder className="h-8 w-8 flex-shrink-0 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 flex-shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    {doc.caption && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.caption}</p>
                    )}
                    {typeof doc.file_size === "number" && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                    )}
                  </div>
                </button>
                <div className="flex justify-end gap-1">
                  {doc.type === "file" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewFile(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownloadFile(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteDocument(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>Nenhum documento ou pasta nesta localização</p>
          </div>
        )}

        <Dialog open={Boolean(previewDoc)} onOpenChange={handleClosePreview}>
          <DialogContent className="max-h-[90vh] max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewDoc?.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              {previewDoc?.file_type?.startsWith("image/") ? (
                <img src={previewUrl} alt={previewDoc.name} className="w-full" />
              ) : previewDoc?.file_type === "application/pdf" ? (
                <iframe src={previewUrl} className="h-[70vh] w-full" />
              ) : (
                <div className="py-12 text-center">
                  <p className="mb-4 text-muted-foreground">
                    Visualização não disponível para este tipo de arquivo
                  </p>
                  <Button onClick={() => previewDoc && handleDownloadFile(previewDoc)}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar arquivo
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
