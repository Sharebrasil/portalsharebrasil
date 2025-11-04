import { useState } from 'react';
import { Trash2, Upload, Receipt } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CATEGORIAS_DESPESA, PAGADORES } from '@/constants/reports';
import { Expense } from '@/types/reports';

interface ExpenseFormProps {
  despesa: Expense;
  index: number;
  onUpdate: (index: number, field: keyof Expense, value: any) => void;
  onRemove: (index: number) => void;
}

export const ExpenseForm = ({ despesa, index, onUpdate, onRemove }: ExpenseFormProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const toDataUrl = (f: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const dataUrl = await toDataUrl(file);
      onUpdate(index, 'comprovante_url', dataUrl);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
    setUploadingIndex(null);
  };

  return (
    <div className="border p-4 rounded-lg bg-gray-50 relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        <button onClick={() => onRemove(index)} className="p-1 rounded-full text-red-500 hover:bg-red-100">
          <Trash2 size={18} />
        </button>
      </div>
      
      <h3 className="text-md font-medium mb-3 text-blue-800">Despesa #{index + 1}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Categoria</label>
          <Select 
            value={despesa.categoria || ''} 
            onValueChange={(value) => onUpdate(index, 'categoria', value)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_DESPESA.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Valor (R$)</label>
          <input
            type="number"
            value={despesa.valor || ''}
            onChange={(e) => onUpdate(index, 'valor', e.target.value)}
            placeholder="0.00"
            className="p-2 border rounded-md text-sm"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Pago Por</label>
          <Select 
            value={despesa.pago_por || ''} 
            onValueChange={(value) => onUpdate(index, 'pago_por', value)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {PAGADORES.map((pag) => (
                <SelectItem key={pag} value={pag}>{pag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Comprovante</label>
          <label className={`flex items-center justify-center p-2 border rounded-md cursor-pointer text-sm ${despesa.comprovante_url ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}>
            {uploadingIndex === index ? (
              <span>Carregando...</span>
            ) : (
              <>
                {despesa.comprovante_url ? <Receipt size={16} className="mr-1" /> : <Upload size={16} className="mr-1" />}
                <span>{despesa.comprovante_url ? 'Comprovante OK' : 'Anexar PDF/Imagem'}</span>
              </>
            )}
            <input 
              type="file" 
              onChange={(e) => handleFileUpload(e.target.files?.[0])} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
          </label>
        </div>
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Descrição</label>
        <input
          type="text"
          value={despesa.descricao || ''}
          onChange={(e) => onUpdate(index, 'descricao', e.target.value)}
          placeholder="Breve descrição da despesa"
          className="p-2 border rounded-md text-sm"
        />
      </div>
    </div>
  );
};