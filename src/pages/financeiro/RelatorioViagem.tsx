import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Save, Send, FileText, Download, MessageCircle, Plus, Trash2, Calendar, MapPin, DollarSign, Clock, Plane, Receipt, Upload, ArrowLeft, Folder, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Layout Web
import { Layout } from '@/components/layout/Layout'; 
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import html2pdf from 'html2pdf.js';

// Componentes do seu Design System (baseado no código original)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// --- FUNÇÕES UTILITÁRIAS EXTERNAS (PARA USO INTERNO) ---

const toFolder = (s: string) => (s || 'sem_cliente')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

const toInputDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDateBR = (value?: string) => {
    if (!value) return '';
    const s = String(value).split('T')[0];
    const parts = s.split('-');
    if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    }
    try { return new Date(value as string).toLocaleDateString('pt-BR'); } catch { return String(value); }
};

const formatCurrencyBR = (value: number | string) => {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Placeholder para a Logo da sua empresa (ajuste o caminho)
const SHAREBRASIL_LOGO = 'https://sharebrasil.com/logo.png'; 

// --- COMPONENTES AUXILIARES DE VISUALIZAÇÃO WEB (ReportFormUI CORRIGIDO) ---

const ReportFormUI = ({ currentReport, handleInputChange, handleDespesaChange, addDespesa, removeDespesa, handleFileUpload, calculateDays, CATEGORIAS_DESPESA, PAGADORES, uploadingIndex, cliente, aeronaves, uniqueTripulantes, showSecondTripulante, setShowSecondTripulante, deleteCreatedReport }) => {
    if (!currentReport) return <p className="text-center text-gray-500 mt-10 p-6">Selecione um rascunho ou clique em "+ Novo Relatório" para começar.</p>;
    
    const isFinalized = currentReport.status === 'finalized';
    const isDraft = !isFinalized;

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" /> 
                {isFinalized ? 'Visualizar Relatório Finalizado' : 'Editar Rascunho de Relatório'}
                {currentReport.numero && <span className="text-lg text-gray-600 ml-2">({currentReport.numero})</span>}
            </h2>
            
            <Card className={isFinalized ? 'opacity-80' : ''}>
                <CardHeader>
                    <CardTitle>Dados Principais da Viagem</CardTitle>
                    {isFinalized && <CardDescription className="text-red-500">Este relatório está finalizado e não pode ser editado. Exclua para recriar.</CardDescription>}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Linha 1: Cliente e Aeronave */}
                    <div className="space-y-2">
                        <Label htmlFor="cliente">Cliente *</Label>
                        <Select onValueChange={(v) => handleInputChange('cliente', v)} value={currentReport.cliente || ''} disabled={isFinalized}>
                            <SelectTrigger id="cliente">
                                <SelectValue placeholder="Selecione o Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {cliente
                                    .filter(c => c.nome && String(c.nome).trim() !== '') // CORREÇÃO: Filtra nomes vazios
                                    .map((c) => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aeronave">Aeronave *</Label>
                        <Select onValueChange={(v) => handleInputChange('aeronave', v)} value={currentReport.aeronave || ''} disabled={isFinalized}>
                            <SelectTrigger id="aeronave">
                                <SelectValue placeholder="Selecione a Aeronave" />
                            </SelectTrigger>
                            <SelectContent>
                                {aeronaves
                                    .filter(a => a.prefixo && String(a.prefixo).trim() !== '') // CORREÇÃO: Filtra prefixos vazios
                                    .map((a) => (
                                        <SelectItem key={a.id} value={a.prefixo}>{a.prefixo} ({a.modelo})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ... (outros inputs de texto e data) ... */}
                    <div className="space-y-2">
                        <Label htmlFor="tripulante">Tripulante Responsável *</Label>
                        <Input 
                            id="tripulante"
                            value={currentReport.tripulante || ''}
                            onChange={(e) => handleInputChange('tripulante', e.target.value)}
                            placeholder="Nome Completo do Tripulante"
                            disabled={isFinalized}
                            list="tripulantes-list"
                        />
                        <datalist id="tripulantes-list">
                            {uniqueTripulantes.map(t => <option key={t} value={t} />)}
                        </datalist>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="destino">Trecho/Destino *</Label>
                        <Input 
                            id="destino" 
                            value={currentReport.destino || ''} 
                            onChange={(e) => handleInputChange('destino', e.target.value)}
                            placeholder="Ex: GRU-CNF-GRU"
                            disabled={isFinalized}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="data_inicio">Data Início *</Label>
                        <Input 
                            id="data_inicio" 
                            type="date" 
                            value={currentReport.data_inicio || ''} 
                            onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                            disabled={isFinalized}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="data_fim">Data Fim *</Label>
                        <Input 
                            id="data_fim" 
                            type="date" 
                            value={currentReport.data_fim || ''} 
                            onChange={(e) => handleInputChange('data_fim', e.target.value)}
                            disabled={isFinalized}
                        />
                        <p className="text-sm text-gray-500">Duração: {calculateDays()} dia(s)</p>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        {showSecondTripulante || currentReport.tripulante2 ? (
                            <>
                                <Label htmlFor="tripulante2">Segundo Tripulante (Opcional)</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="tripulante2"
                                        value={currentReport.tripulante2 || ''}
                                        onChange={(e) => handleInputChange('tripulante2', e.target.value)}
                                        placeholder="Nome do Segundo Tripulante"
                                        disabled={isFinalized}
                                        list="tripulantes-list-2"
                                    />
                                    <datalist id="tripulantes-list-2">
                                        {uniqueTripulantes.map(t => <option key={t} value={t} />)}
                                    </datalist>
                                    {isDraft && (
                                        <Button variant="ghost" onClick={() => { handleInputChange('tripulante2', ''); setShowSecondTripulante(false); }} className="text-red-500" title="Remover Segundo Tripulante"><Trash2 className="w-4 h-4" /></Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setShowSecondTripulante(true)} disabled={isFinalized}>
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Segundo Tripulante
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Seção de Totais (Visível em Finalizado ou Rascunho com despesas) */}
            {(isFinalized || (currentReport.despesas && currentReport.despesas.length > 0)) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo de Custos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                            <div><DollarSign className="w-4 h-4 inline mr-1 text-green-600" /> Combustível: **R$ {formatCurrencyBR(currentReport.total_combustivel)}**</div>
                            <div><MapPin className="w-4 h-4 inline mr-1 text-blue-600" /> Hospedagem: **R$ {formatCurrencyBR(currentReport.total_hospedagem)}**</div>
                            <div><Plane className="w-4 h-4 inline mr-1 text-yellow-600" /> Alimentação: **R$ {formatCurrencyBR(currentReport.total_alimentacao)}**</div>
                            <div><Clock className="w-4 h-4 inline mr-1 text-purple-600" /> Transporte: **R$ {formatCurrencyBR(currentReport.total_transporte)}**</div>
                            <div className="md:col-span-4 text-lg font-bold pt-2 border-t mt-2 flex justify-between">
                                <span>Total Geral:</span>
                                <span>R$ {formatCurrencyBR(currentReport.valor_total)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Seção de Despesas */}
            <Card className={isFinalized ? 'opacity-80' : ''}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Despesas Detalhadas
                        {isDraft && (
                            <Button onClick={addDespesa} variant="secondary"><Plus className="w-4 h-4 mr-2" /> Adicionar Despesa</Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(currentReport.despesas || []).map((despesa, index) => (
                        <div key={index} className="border p-4 rounded-lg space-y-3 relative">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Receipt className="w-5 h-5" /> Despesa #{index + 1}
                            </h3>
                            {isDraft && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeDespesa(index)} 
                                    className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
                                    title="Remover Despesa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Categoria */}
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select onValueChange={(v) => handleDespesaChange(index, 'categoria', v)} value={despesa.categoria || ''} disabled={isFinalized}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a Categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIAS_DESPESA
                                                .filter(c => c !== '') // CORREÇÃO: Filtro defensivo
                                                .map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Valor */}
                                <div className="space-y-2">
                                    <Label>Valor (R$)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={despesa.valor || ''} 
                                        onChange={(e) => handleDespesaChange(index, 'valor', e.target.value)}
                                        disabled={isFinalized}
                                    />
                                </div>

                                {/* Pago Por */}
                                <div className="space-y-2">
                                    <Label>Pago Por</Label>
                                    <Select onValueChange={(v) => handleDespesaChange(index, 'pago_por', v)} value={despesa.pago_por || ''} disabled={isFinalized}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pago Por" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAGADORES
                                                .filter(p => p !== '') // CORREÇÃO: Filtro defensivo
                                                .map((p) => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Comprovante */}
                                <div className="space-y-2">
                                    <Label>Comprovante</Label>
                                    {despesa.comprovante_url ? (
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => window.open(despesa.comprovante_url, '_blank')}>
                                                <Eye className="w-4 h-4 mr-2" /> {despesa.comprovante_url.includes('/pdf') ? 'Ver PDF' : 'Ver Imagem'}
                                            </Button>
                                            {isDraft && (
                                                <Button variant="ghost" size="sm" onClick={() => handleDespesaChange(index, 'comprovante_url', '')} title="Remover Anexo"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Input 
                                                id={`comprovante-${index}`}
                                                type="file" 
                                                accept="image/*, application/pdf"
                                                className="opacity-0 w-full h-full absolute cursor-pointer"
                                                onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                                                disabled={isFinalized || uploadingIndex === index}
                                            />
                                            <Button asChild variant="outline" disabled={isFinalized || uploadingIndex === index}>
                                                <label htmlFor={`comprovante-${index}`}>
                                                    {uploadingIndex === index ? 'Enviando...' : (
                                                        <>
                                                            <Upload className="w-4 h-4 mr-2" /> Anexar
                                                        </>
                                                    )}
                                                </label>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-2 col-span-full">
                                <Label>Descrição</Label>
                                <Textarea 
                                    value={despesa.descricao || ''} 
                                    onChange={(e) => handleDespesaChange(index, 'descricao', e.target.value)}
                                    placeholder="Detalhe brevemente a despesa..."
                                    rows={1}
                                    disabled={isFinalized}
                                />
                            </div>
                        </div>
                    ))}
                    {currentReport.despesas.length > 0 && (
                        <div className="text-right mt-4 font-bold text-xl">
                            Total Geral: R$ {formatCurrencyBR(currentReport.valor_total)}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Observações */}
            <Card className={isFinalized ? 'opacity-80' : ''}>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={currentReport.observacoes || ''} 
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        placeholder="Adicione quaisquer observações relevantes sobre a viagem ou despesas..."
                        rows={4}
                        disabled={isFinalized}
                    />
                </CardContent>
            </Card>

            {isFinalized && (
                <div className="flex justify-end pt-4">
                    <Button 
                        onClick={() => deleteCreatedReport(currentReport)} 
                        variant="destructive"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Relatório Finalizado
                    </Button>
                </div>
            )}
        </div>
    );
};


const HistoryList = ({ history, openPdfModal, loadingHistory, refreshHistory, deleteHistoryItem }) => (
    <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
                <Folder className="w-5 h-5 text-gray-700" />
                Histórico Finalizado
            </CardTitle>
            <Button onClick={refreshHistory} variant="ghost" disabled={loadingHistory} size="sm">
                <Clock className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2 p-4 pt-0">
            {loadingHistory && <p className="text-sm text-gray-500 text-center py-4">Carregando histórico...</p>}
            {history.length === 0 && !loadingHistory && (
                <p className="text-sm text-gray-500">Nenhum relatório finalizado encontrado.</p>
            )}
            {history.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">{item.numero_relatorio}</p>
                        <p className="text-xs text-gray-500 truncate">{item.cliente} - {formatDateBR(item.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 ml-3">
                        <Button variant="ghost" size="icon" onClick={() => openPdfModal(item.pdf_path)} title="Visualizar PDF">
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(item)} title="Excluir Histórico (PDF e Registro)">
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

const DraftsList = ({ visibleReports, selectedCliente, setSelectedCliente, allClienteFolders, createNewReport, setCurrentReport, deleteReport }) => (
    <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-col gap-3">
            <CardTitle className="text-xl flex items-center justify-between">
                Rascunhos Locais
                <Button onClick={createNewReport} size="sm" className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" /> Novo Relatório
                </Button>
            </CardTitle>
            <div className="space-y-1">
                <Label htmlFor="filter-cliente" className="text-sm text-gray-600">Filtrar por Cliente</Label>
                <Select onValueChange={setSelectedCliente} value={selectedCliente}>
                    <SelectTrigger id="filter-cliente">
                        <SelectValue placeholder="Todos os Clientes" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Este é o item com value="" que é permitido (limpar seleção) */}
                        <SelectItem value="">Todos os Clientes</SelectItem> 
                        <Separator />
                        {allClienteFolders
                            .filter(c => c !== '') // CORREÇÃO: Filtro defensivo
                            .map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2 p-4 pt-0">
            {visibleReports.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum rascunho. Comece um novo relatório!</p>
            ) : (
                visibleReports.map((report) => (
                    <div 
                        key={report.numero} 
                        className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition flex justify-between items-center" 
                        onClick={() => setCurrentReport(report)}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-sm">{report.numero || `Rascunho: ${formatDateBR(report.createdAt)}`}</p>
                            <p className="text-xs text-gray-500 truncate">{report.cliente} - {report.destino}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteReport(report.numero); }} title="Excluir Rascunho">
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                ))
            )}
        </CardContent>
    </Card>
);

// --- FUNÇÃO CRUCIAL PARA GERAÇÃO DE PDF (COM ESTILOS INLINE PARA HTML2PDF) ---
const generateHTMLReport = (report: any, currentFullName: string) => {
    // ... (Esta função permanece inalterada, pois o erro é no Select, não no HTML do PDF)
    const totalGeral = formatCurrencyBR(report.valor_total);
    const dataViagem = `${formatDateBR(report.data_inicio)} a ${formatDateBR(report.data_fim)}`;
    const dias = (report.data_inicio && report.data_fim) ? ((Math.ceil(Math.abs(new Date(report.data_fim).getTime() - new Date(report.data_inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1) + ' dias') : '1 dia';

    const headerStyle = 'font-size: 10px; color: #555; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 5px;';
    const footerStyle = 'font-size: 9px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 5px; position: fixed; bottom: 10px; width: 90%;';
    const pageStyle = 'width: 100%; margin: 0 auto; padding: 20px; box-sizing: border-box; font-family: Arial, sans-serif;';
    const tableHeaderStyle = 'background-color: #f2f2f2; font-weight: bold; padding: 8px; border: 1px solid #ccc; font-size: 10px;';
    const tableCellStyle = 'padding: 8px; border: 1px solid #ccc; font-size: 10px; vertical-align: top;';

    const htmlContent = `
        <div style="${pageStyle}">
            
            <header style="${headerStyle}">
                <img id="report-logo" src="${SHAREBRASIL_LOGO}" alt="Logo" style="height: 40px; margin-bottom: 10px;"/>
                <div style="font-size: 12px; font-weight: bold; color: #333;">RELATÓRIO DE VIAGEM</div>
                <div style="font-size: 16px; font-weight: bold; color: #007bff; margin-top: 5px;">${report.numero}</div>
            </header>

            <footer style="${footerStyle}">
                Relatório gerado por: ${currentFullName} em ${formatDateBR(new Date().toISOString())} | Página <span class="page-number"></span> de <span class="page-count"></span>
            </footer>

            <h2 style="font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #007bff; padding-bottom: 5px; color: #007bff;">DADOS DA VIAGEM</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="${tableCellStyle} width: 25%;">**Cliente:**</td>
                    <td style="${tableCellStyle} width: 75%;">${report.cliente}</td>
                </tr>
                <tr>
                    <td style="${tableCellStyle}">**Aeronave:**</td>
                    <td style="${tableCellStyle}">${report.aeronave}</td>
                </tr>
                <tr>
                    <td style="${tableCellStyle}">**Tripulante(s):**</td>
                    <td style="${tableCellStyle}">${report.tripulante}${report.tripulante2 ? ` e ${report.tripulante2}` : ''}</td>
                </tr>
                <tr>
                    <td style="${tableCellStyle}">**Trecho/Destino:**</td>
                    <td style="${tableCellStyle}">${report.destino}</td>
                </tr>
                <tr>
                    <td style="${tableCellStyle}">**Período (${dias}):**</td>
                    <td style="${tableCellStyle}">${dataViagem}</td>
                </tr>
            </table>

            <h2 style="font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #007bff; padding-bottom: 5px; color: #007bff;">RESUMO DE CUSTOS</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr>
                        <td style="${tableHeaderStyle}">Categoria</td>
                        <td style="${tableHeaderStyle}">Pago por Tripulante</td>
                        <td style="${tableHeaderStyle}">Pago por Cliente</td>
                        <td style="${tableHeaderStyle}">Pago por ShareBrasil</td>
                        <td style="${tableHeaderStyle}">Total por Categoria</td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="${tableCellStyle}">Combustível</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_combustivel * (report.total_combustivel_tripulante_rate || 1))}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_combustivel_cliente_rate || 0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_combustivel_share_brasil_rate || 0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_combustivel)}</td>
                    </tr>
                    <tr>
                        <td style="${tableCellStyle}">Hospedagem</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_hospedagem)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_hospedagem)}</td>
                    </tr>
                    <tr>
                        <td style="${tableCellStyle}">Alimentação</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_alimentacao)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_alimentacao)}</td>
                    </tr>
                    <tr>
                        <td style="${tableCellStyle}">Transporte</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_transporte)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_transporte)}</td>
                    </tr>
                    <tr>
                        <td style="${tableCellStyle}">Outros</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_outros)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(0)}</td>
                        <td style="${tableCellStyle}">R$ ${formatCurrencyBR(report.total_outros)}</td>
                    </tr>
                    <tr>
                        <td style="${tableHeaderStyle}">TOTAL GERAL</td>
                        <td style="${tableHeaderStyle}">R$ ${formatCurrencyBR(report.total_tripulante)}</td>
                        <td style="${tableHeaderStyle}">R$ ${formatCurrencyBR(report.total_cliente)}</td>
                        <td style="${tableHeaderStyle}">R$ ${formatCurrencyBR(report.total_share_brasil)}</td>
                        <td style="${tableHeaderStyle}; background-color: #ffc107;">R$ ${totalGeral}</td>
                    </tr>
                </tbody>
            </table>

            <h2 style="font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #007bff; padding-bottom: 5px; color: #007bff;">OBSERVAÇÕES</h2>
            <div style="border: 1px solid #ccc; padding: 10px; min-height: 50px; font-size: 10px; margin-bottom: 30px;">
                ${report.observacoes || 'Nenhuma observação registrada.'}
            </div>

            <div style="page-break-before: always;"></div>
            <h2 style="font-size: 14px; margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px; color: #007bff;">DETALHE DAS DESPESAS E COMPROVANTES</h2>
            
            ${(report.despesas || []).map((d, index) => {
                const isImage = d.comprovante_url && !d.comprovante_url.includes('application/pdf');
                const isPdf = d.comprovante_url && d.comprovante_url.includes('application/pdf');
                
                return `
                    <div style="border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; page-break-inside: avoid;">
                        <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">${index + 1}. ${d.categoria} - R$ ${formatCurrencyBR(d.valor)}</div>
                        <div style="font-size: 10px; margin-bottom: 5px;">**Descrição:** ${d.descricao || 'N/A'}</div>
                        <div style="font-size: 10px; margin-bottom: 10px;">**Pago Por:** ${d.pago_por}</div>
                        
                        ${isImage ? `
                            <div style="margin-top: 10px; text-align: center;">
                                <img class="receipt-image" src="${d.comprovante_url}" style="max-width: 90%; max-height: 250px; border: 1px solid #ccc;"/>
                            </div>
                        ` : isPdf ? `
                            <div style="font-size: 11px; color: #888; margin-top: 10px; text-align: center;">
                                <span style="font-weight: bold; color: #ff5722;">PDF Anexado</span> (Não é exibido no PDF, mas está salvo no Storage.)
                            </div>
                        ` : `
                            <div style="font-size: 11px; color: #aaa; margin-top: 10px; text-align: center;">
                                Sem comprovante anexado.
                            </div>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    return htmlContent;
};


// --- COMPONENTE PRINCIPAL ---

const TravelReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [currentReport, setCurrentReport] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const [cliente, setCliente] = useState<any[]>([]);
    const [aeronaves, setAeronaves] = useState<any[]>([]);
    const [tripulantesList, setTripulantesList] = useState<string[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<string>('');
    const [currentFullName, setCurrentFullName] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Constantes do sistema
    // CORREÇÃO: Usamos o filter defensivamente no map, mas aqui garantimos que não haja '' acidentalmente.
    const CATEGORIAS_DESPESA = ["Combustível", "Hospedagem", "Alimentação", "Transporte", "Outros"].filter(Boolean).filter(c => c !== '');
    const PAGADORES = ["Tripulante", "Cliente", "ShareBrasil"].filter(Boolean).filter(p => p !== '');

    // Modal de visualização de PDF
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);
    const openPdfModal = (url: string) => { setPdfModalUrl(url); setPdfModalOpen(true); };

    // Trigger de Download
    const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 1000);
    };

    const getReportPdfUrl = async (report?: any): Promise<string | null> => {
        // ... (função inalterada) ...
        try {
            const targetReport = report || currentReport;
            if (!targetReport?.numero) return null;
            const safeNum = String(targetReport.numero || '').replace(/[\\/]/g, '-');
            const candidatePath = targetReport?.cliente ? `${toFolder(targetReport.cliente)}/${safeNum}.pdf` : null;

            const trySign = async (p: string | null) => {
                if (!p) return null;
                const { data: signed, error } = await supabase.storage.from('report-history').createSignedUrl(p, 604800);
                if (!error && signed?.signedUrl) return signed.signedUrl as string;
                const pub = supabase.storage.from('report-history').getPublicUrl(p).data.publicUrl as string | null;
                return pub || null;
            };

            // 1) tenta caminho direto pelo cliente/número
            let url = await trySign(candidatePath);
            if (url) return url;

            // 2) fallback: consulta histórico apenas por PDFs
            const { data } = await (supabase as any)
                .from('travel_report_history')
                .select('pdf_path')
                .eq('numero_relatorio', targetReport.numero)
                .like('pdf_path', '%.pdf')
                .order('created_at', { ascending: false })
                .limit(1);
            const pathFromHistory = (data && data[0]?.pdf_path) || null;
            url = await trySign(pathFromHistory);
            return url;
        } catch {
            return null;
        }
    };

    // Ações do histórico: abrir direto e excluir
    const openHistoryDirect = async (item: any) => {
        try {
            const { data: signed } = await supabase.storage.from('report-history').createSignedUrl(item.pdf_path, 604800);
            const url = signed?.signedUrl || '';
            if (!url) { alert('URL do PDF não encontrada.'); return; }
            window.open(url, '_blank');
        } catch (e) {
            alert('Não foi possível abrir o PDF.');
        }
    };

    const deleteHistoryItem = async (item: any) => {
        const ok = confirm('Tem certeza que deseja excluir este PDF do histórico? Esta ação não pode ser desfeita.');
        if (!ok) return;
        try {
            try { await supabase.storage.from('report-history').remove([item.pdf_path]); } catch {}
            try { await (supabase as any).from('travel_report_history').delete().eq('id', item.id); } catch {}
            setHistory((prev:any[]) => prev.filter((h:any) => h.id !== item.id));
            alert('Excluído com sucesso.');
        } catch (e) {
            alert('Erro ao excluir.');
        }
    };

    // Carregar relatórios salvos e dados iniciais
    useEffect(() => {
        const savedReports = JSON.parse(localStorage.getItem('travelReports') || '[]');
        setReports(savedReports);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                // CORREÇÃO: Garante que os dados do Supabase sejam filtrados
                const { data, error } = await supabase.from('clients').select('id, company_name').order('company_name');
                if (!error) {
                    setCliente((data || [])
                        .map((c: any) => ({ id: c.id, nome: String(c.company_name || '').trim() }))
                        .filter((c: any) => c.nome !== '')); // Filtra itens sem nome
                }
            } catch (e) { /* ignore */ }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                // CORREÇÃO: Garante que os dados do Supabase sejam filtrados
                const { data } = await supabase.from('aircraft').select('id, registration, model').order('registration');
                setAeronaves((data || [])
                    .map((a: any) => ({ id: a.id, prefixo: String(a.registration || '').trim(), modelo: a.model }))
                    .filter((a: any) => a.prefixo !== '')); // Filtra itens sem prefixo
            } catch (e) { /* ignore */ }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('crew_members').select('full_name').order('full_name');
                if (!error) setTripulantesList((data || []).map((t:any)=>String(t.full_name || '').trim()).filter(Boolean).filter(t => t !== ''));
            } catch (e) { /* noop */ }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                let name: string | null = null;
                try {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .maybeSingle();
                    name = (profile as any)?.full_name || null;
                } catch {}
                setCurrentFullName(name || (user.user_metadata && (user.user_metadata as any).full_name) || user.email || '');
            } catch {}
        })();
    }, []);

    const refreshHistory = async () => {
        try {
            setLoadingHistory(true);
            const { data, error } = await (supabase as any)
                .from('travel_report_history')
                .select('id, numero_relatorio, cliente, pdf_path, created_at')
                .like('pdf_path', '%.pdf')
                .order('created_at', { ascending: false });
            if (!error) setHistory(data || []);
        } finally {
            setLoadingHistory(false);
        }
    };
    useEffect(() => { refreshHistory(); }, []);

    useEffect(() => {
        if (!pdfModalOpen && pdfModalUrl && pdfModalUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(pdfModalUrl); } catch {}
            setPdfModalUrl(null);
        }
    }, [pdfModalOpen]);

    // Helpers de visualização (Memoizados)
    const dbClienteNames = useMemo(() => (cliente || []).map((c:any) => String(c?.nome || '').trim()).filter(Boolean), [cliente]);
    const reportClienteNames = useMemo(() => Array.from(new Set((reports || []).map((r:any) => String(r?.cliente || '').trim()).filter(Boolean))), [reports]);
    const historyClienteNames = useMemo(() => Array.from(new Set((history || []).map((h:any) => String(h?.cliente || '').trim()).filter(Boolean))), [history]);
    const allClienteFolders = useMemo(() => Array.from(new Set([
        ...dbClienteNames, ...reportClienteNames, ...historyClienteNames,
    ].filter(Boolean))).filter(c => c !== '').sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [dbClienteNames, reportClienteNames, historyClienteNames]); // CORREÇÃO: Filtro final garantindo que não há ''
    const visibleReports = useMemo(() => (selectedCliente ? (reports || []).filter((r:any) => r?.cliente === selectedCliente) : (reports || []))
        .filter((r:any) => r?.status !== 'finalized'), [reports, selectedCliente]);
    const uniqueTripulantes = useMemo(() => Array.from(new Set((tripulantesList || []).filter(Boolean).filter(t => t !== ''))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [tripulantesList]);
    
    // Estados para Tripulante 2
    const [showSecondTripulante, setShowSecondTripulante] = useState<boolean>(false);
    useEffect(() => { if (currentReport?.tripulante2 && !showSecondTripulante) setShowSecondTripulante(true); }, [currentReport?.tripulante2]);

    // Salvar relatórios
    const saveReports = (updatedReports) => {
        localStorage.setItem('travelReports', JSON.stringify(updatedReports));
        setReports(updatedReports);
    };

    // ... (Outras funções, como deleteReport, deleteCreatedReport, generateReportNumberLocal, allocateReportNumber, createNewReport, calculateTotals, calculateDays, saveReport, handleInputChange, handleDespesaChange, addDespesa, removeDespesa, handleFileUpload, e generatePDF, permanecem inalteradas, pois o problema era o map nos Selects) ...

    // Excluir relatório salvo (rascunho local)
    const deleteReport = (numero) => {
        if (!numero) return;
        const ok = confirm('Tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.');
        if (!ok) return;
        const updated = reports.filter((r) => r.numero !== numero);
        saveReports(updated);
        setCurrentReport(null);
        alert('Rascunho excluído com sucesso.');
    };

    // Excluir relatório criado/finalizado
    const deleteCreatedReport = async (report: any) => {
        if (!report?.numero) { alert('Relatório inválido.'); return; }
        const ok = confirm(`Excluir o relatório ${report.numero}? Esta ação apagará o PDF do servidor e o registro no banco.`);
        if (!ok) return;
        try {
            const folder = toFolder(report.cliente);
            const pdfPath = `${folder}/${String(report.numero || '').replace(/[\\/]/g, '-')}.pdf`;
            const jsonPath = `${folder}/${String(report.numero || '').replace(/[\\/]/g, '-')}.json`;
            try { await supabase.storage.from('report-history').remove([pdfPath]); } catch {}
            try { await supabase.storage.from('report-history').remove([jsonPath]); } catch {}
            try { await (supabase as any).from('travel_report_history').delete().or(`numero_relatorio.eq.${report.numero},pdf_path.eq.${pdfPath}`); } catch {}
            try {
                if (report.db_id) {
                    await (supabase as any).from('travel_reports').delete().eq('id', report.db_id);
                } else {
                    await (supabase as any).from('travel_reports').delete().eq('report_number', report.numero);
                }
            } catch {}
            saveReports((reports || []).filter((r:any)=> r.numero !== report.numero));
            setHistory((prev:any[]) => (prev || []).filter((h:any)=> h.numero_relatorio !== report.numero && h.pdf_path !== pdfPath));
            setCurrentReport(null);
            alert('Relatório excluído com sucesso.');
        } catch (e) {
            alert('Não foi possível excluir completamente. Verifique sua conexão e tente novamente.');
        }
    };

    // Funções de Geração de Número (Mantidas as do código original)
    const generateReportNumberLocal = (cliente) => {
        const yyyy = String(new Date().getFullYear());
        if (!cliente) return `XXX001/${yyyy}`;

        const clienteLetras = cliente.substring(0, 3).toUpperCase().padEnd(3, 'X');

        const maxNumber = (reports || [])
            .filter((report:any) => report.cliente === cliente)
            .reduce((max:number, report:any) => {
                const raw = String(report.numero || '');
                const yearSuffix = (raw.match(/\/(\d{4})\b/) || [null, null])[1];
                const createdYear = (()=>{ try { return String(report.createdAt || '').slice(0,4); } catch { return null; } })();
                const isSameYear = yearSuffix ? (yearSuffix === yyyy) : (createdYear === yyyy);
                if (!isSameYear) return max;
                const match = raw.match(/\d+/);
                if (match) {
                    const num = parseInt(match[0]);
                    return num > max ? num : max;
                }
                return max;
            }, 0);

        return `${clienteLetras}${String(maxNumber + 1).padStart(3, '0')}/${yyyy}`;
    };

    const allocateReportNumber = async (cliente: string) => {
        try {
            const { data, error } = await (supabase as any).rpc('generate_travel_report_number', {
                p_client_name: cliente
            });

            if (error) {
                console.error('Erro ao gerar número via RPC:', error);
                return generateReportNumberLocal(cliente);
            }

            if (data) {
                return data as string;
            }

            return generateReportNumberLocal(cliente);
        } catch (e) {
            console.error('Erro ao chamar RPC generate_travel_report_number:', e);
            return generateReportNumberLocal(cliente);
        }
    };

    // Criar novo relatorio
    const createNewReport = () => {
        const lastCreated = (()=>{ try { return localStorage.getItem('last_created_tripulante_name') || ''; } catch { return ''; } })();
        const newReport = {
            numero: '',
            cliente: '',
            aeronave: '',
            tripulante: lastCreated || '',
            tripulante2: '',
            destino: '',
            data_inicio: toInputDateLocal(new Date()),
            data_fim: toInputDateLocal(new Date()),
            despesas: [{ categoria: '', descricao: '', valor: '', pago_por: '', comprovante_url: '' }],
            total_combustivel: 0,
            total_hospedagem: 0,
            total_alimentacao: 0,
            total_transporte: 0,
            total_outros: 0,
            total_tripulante: 0,
            total_cliente: 0,
            total_share_brasil: 0,
            valor_total: 0,
            observacoes: '',
            status: 'draft', // draft, finalized
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as any;

        if (lastCreated) { try { localStorage.removeItem('last_created_tripulante_name'); } catch {} }

        setCurrentReport(newReport);
        setIsCreating(true);
        setShowSecondTripulante(!!newReport.tripulante2);
    };

    // Calcular totais
    const calculateTotals = (despesas) => {
        const totals = {
            total_combustivel: 0, total_hospedagem: 0, total_alimentacao: 0, 
            total_transporte: 0, total_outros: 0, total_tripulante: 0, 
            total_cliente: 0, total_share_brasil: 0
        };

        despesas.forEach(despesa => {
            const valor = Number(despesa.valor) || 0;
            
            // Totais por categoria
            switch (despesa.categoria) {
                case 'Combustível': totals.total_combustivel += valor; break;
                case 'Hospedagem': totals.total_hospedagem += valor; break;
                case 'Alimentação': totals.total_alimentacao += valor; break;
                case 'Transporte': totals.total_transporte += valor; break;
                default: totals.total_outros += valor;
            }

            // Totais por pagador
            switch (despesa.pago_por) {
                case 'Tripulante': totals.total_tripulante += valor; break;
                case 'Cliente': totals.total_cliente += valor; break;
                case 'ShareBrasil': totals.total_share_brasil += valor; break;
            }
        });

        const valor_total = totals.total_tripulante + totals.total_cliente + totals.total_share_brasil;

        setCurrentReport(prev => ({
            ...prev,
            ...totals,
            valor_total
        }));
    };

    // Calcular dias da viagem
    const calculateDays = () => {
        if (currentReport?.data_inicio && currentReport?.data_fim) {
            const inicio = new Date(currentReport.data_inicio);
            const fim = new Date(currentReport.data_fim);
            const diffTime = Math.abs(fim.getTime() - inicio.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
        return 1;
    };

    // Salvar rascunho local ou finalizar
    const saveReport = async (status = 'draft') => {
        if (!currentReport) return;

        const updatedReport: any = {
            ...currentReport,
            status,
            updatedAt: new Date().toISOString()
        };

        // Validação apenas ao finalizar
        if (status === 'finalized') {
            const missing = [] as string[];
            if (!updatedReport.cliente) missing.push('Cliente');
            if (!updatedReport.aeronave) missing.push('Aeronave');
            if (!updatedReport.tripulante) missing.push('Tripulante');
            if (!updatedReport.destino) missing.push('Trecho');
            if (!updatedReport.data_inicio) missing.push('Data Início');
            if (missing.length) {
                alert(`Preencha os campos obrigatórios: ${missing.join(', ')}.`);
                return;
            }
        }

        // Geração de número para rascunho (sempre garantir um identificador único)
        try {
            if (!updatedReport.numero) {
                if (updatedReport.cliente) {
                    try {
                        updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
                    } catch {
                        updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
                    }
                } else {
                    updatedReport.numero = `rascunho_${Date.now()}`;
                }
            }
        } catch {}

        // Se não for finalização, salvar apenas localmente (rascunho)
        if (status !== 'finalized') {
            try {
                if (!updatedReport.numero && updatedReport.cliente) {
                    try {
                        updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
                    } catch {
                        updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
                    }
                }
            } catch {}

            const existingIndex = reports.findIndex(r => r.numero === updatedReport.numero);
            let updatedReports;
            if (existingIndex >= 0) {
                updatedReports = [...reports];
                updatedReports[existingIndex] = updatedReport;
            } else {
                updatedReports = [...reports, updatedReport];
            }
            saveReports(updatedReports);
            setCurrentReport(updatedReport);
            alert('Rascunho salvo!');
            return;
        }

        // Finalização: gerar PDF antes de persistir
        setCurrentReport(updatedReport);
        setIsGeneratingPdf(true); // Inicia loading
        
        // Garantir número REAL do relatório antes do PDF (não rascunho_*)
        try {
            if (!updatedReport.numero || updatedReport.numero.startsWith('rascunho_')) {
                if (updatedReport.cliente) {
                    updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
                }
            }
        } catch {
            if (!updatedReport.numero || updatedReport.numero.startsWith('rascunho_')) {
                updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
            }
        }
        
        // Geração do PDF
        const pdfBlob = await generatePDF(updatedReport, currentFullName, { download: false });
        if (!pdfBlob) {
            setIsGeneratingPdf(false);
            setCurrentReport(prev => ({ ...prev, status: 'draft' }));
            alert('Falha ao gerar PDF. Relatório NÃO foi salvo no banco.');
            return;
        }

        // Baixar localmente imediatamente
        try {
            const filename = `${updatedReport.numero}-relatorio-viagem.pdf`;
            triggerDownload(pdfBlob, filename);
        } catch {}

        // PASSO 1: Upload do PDF no Storage
        const toFolderSafe = (s: string) => (s || 'sem_cliente')
            .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_');

        const folder = toFolderSafe(updatedReport.cliente);
        const pdfPath = `${folder}/${String(updatedReport.numero || '').replace(/[\\/]/g, '-')}.pdf`;
        let pdfUploadSuccess = false;

        try {
            const { error: upErr } = await supabase.storage.from('report-history').upload(pdfPath, pdfBlob, {
                upsert: true,
                contentType: 'application/pdf'
            });
            if (upErr) throw upErr;
            pdfUploadSuccess = true;
        } catch (e) {
            setIsGeneratingPdf(false);
            console.error('Falha ao enviar PDF ao Storage:', e);
            alert('Não foi possível fazer upload do PDF. O relatório não será salvo no banco.');
            return;
        }

        // PASSO 2: Persistir no Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser();

            let finalNumber = updatedReport.numero;
            if (!finalNumber || finalNumber.startsWith('rascunho_')) {
                 finalNumber = await allocateReportNumber(updatedReport.cliente);
            }

            const payload: any = {
                report_number: finalNumber, // Ajuste para o nome da coluna no seu DB
                cliente: updatedReport.cliente || '',
                aeronave: updatedReport.aeronave || '',
                tripulante: updatedReport.tripulante || '',
                tripulante2: updatedReport.tripulante2 || null,
                destino: updatedReport.destino || '',
                data_inicio: updatedReport.data_inicio || '',
                data_fim: updatedReport.data_fim || null,
                observacoes: updatedReport.observacoes || null,
                valor_total: Number(updatedReport.valor_total || 0),
                total_combustivel: Number(updatedReport.total_combustivel || 0),
                total_hospedagem: Number(updatedReport.total_hospedagem || 0),
                total_alimentacao: Number(updatedReport.total_alimentacao || 0),
                total_transporte: Number(updatedReport.total_transporte || 0),
                total_outros: Number(updatedReport.total_outros || 0),
                total_tripulante: Number(updatedReport.total_tripulante || 0),
                total_cliente: Number(updatedReport.total_cliente || 0),
                total_share_brasil: Number(updatedReport.total_share_brasil || 0),
                created_by: user?.id || null,
                report_data_json: updatedReport, // Salva o JSON completo do relatório
            };

            let dbRow: any | null = null;
            if (updatedReport.db_id) {
                // UPDATE (se já tiver sido salvo)
                const { data, error } = await supabase
                    .from('travel_reports')
                    .update(payload)
                    .eq('id', updatedReport.db_id)
                    .select()
                    .single();
                if (error) throw error;
                dbRow = data;
            } else {
                // INSERT (primeiro salvamento)
                const insertRes = await supabase
                    .from('travel_reports')
                    .insert(payload)
                    .select()
                    .single();
                if (insertRes.error) throw insertRes.error;
                dbRow = insertRes.data;
            }

            if (dbRow) {
                updatedReport.numero = dbRow.report_number || finalNumber || '';
                updatedReport.db_id = dbRow.id;
            }

            // PASSO 3: Registrar histórico com pdf_path
            if (pdfUploadSuccess) {
                try {
                    const ins = await (supabase as any)
                        .from('travel_report_history')
                        .insert({
                            report_id: updatedReport.db_id || null,
                            numero_relatorio: finalNumber || updatedReport.numero,
                            cliente: updatedReport.cliente,
                            pdf_path: pdfPath,
                            metadata: { /* ... (metadata) ... */ }
                        })
                        .select('*')
                        .single();
                    if (!ins.error && ins.data) {
                        setHistory((prev:any[]) => [ins.data, ...(prev || [])]);
                    } else {
                        await refreshHistory();
                    }
                } catch (e) {
                    await refreshHistory();
                }
            }

        } catch (e: any) {
            setIsGeneratingPdf(false);
            console.error('Falha ao salvar no banco:', e);
            alert(`Falha ao salvar no banco. Tente novamente.`);
            // Não retornar aqui: manter local para evitar perda
        }

        // Atualiza localStorage (remove rascunho e adiciona finalizado)
        const existingIndex = reports.findIndex(r => r.numero === updatedReport.numero);
        let updatedReports;
        if (existingIndex >= 0) {
            updatedReports = [...reports];
            updatedReports[existingIndex] = updatedReport;
        } else {
            updatedReports = [...reports, updatedReport];
        }
        
        // Remove rascunho se for bem sucedido
        if(pdfUploadSuccess) {
            updatedReports = updatedReports.filter((r:any) => r.numero !== currentReport.numero || r.numero === updatedReport.numero);
        }

        saveReports(updatedReports);
        setCurrentReport(updatedReport);
        setIsGeneratingPdf(false);
        alert('Relatório finalizado, salvo e PDF gerado!');
    };

    // Atualizar campo do formulário
    const handleInputChange = (field, value) => {
        const updated = { ...currentReport, [field]: value };
        setCurrentReport(updated);
    };

    // Atualizar despesa
    const handleDespesaChange = (index, field, value) => {
        const newDespesas = [...currentReport.despesas];
        newDespesas[index][field] = field === 'valor' ? value : value;
        setCurrentReport(prev => ({ ...prev, despesas: newDespesas }));
        calculateTotals(newDespesas);
    };

    // Adicionar despesa
    const addDespesa = () => {
        setCurrentReport(prev => ({
            ...prev,
            despesas: [...prev.despesas, { categoria: '', descricao: '', valor: '', pago_por: '', comprovante_url: '' }]
        }));
    };

    // Remover despesa
    const removeDespesa = (index) => {
        const newDespesas = currentReport.despesas.filter((_, i) => i !== index);
        setCurrentReport(prev => ({ ...prev, despesas: newDespesas }));
        calculateTotals(newDespesas);
    };

    // Simular upload de arquivo (Mantida a do código original)
    const handleFileUpload = async (index, file) => {
        if (!file) return;
        setUploadingIndex(index);
        try {
            const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(f);
            });
            const dataUrl = await toDataUrl(file);
            handleDespesaChange(index, 'comprovante_url', dataUrl);
        } catch (error) {
            console.error('Erro no upload:', error);
        }
        setUploadingIndex(null);
    };

    // Gerar PDF (Mantida a estrutura do código original)
    const generatePDF = async (reportParam?: any, currentFullName: string, options?: { download?: boolean }): Promise<Blob | null> => {
        const report = reportParam || currentReport;
        if (!report) {
            alert('Relatório inválido.');
            return null;
        }

        setIsGeneratingPdf(true);
        const download = !(options && options.download === false);

        try {
            // 1. Gera o HTML com os dados do relatório
            const htmlContent = generateHTMLReport(report, currentFullName);
            const element = document.createElement('div');
            element.innerHTML = htmlContent;

            // 2. Trata imagens e PDFs (Mantido o tratamento do código original)
            try {
                const receiptImgs = Array.from(element.querySelectorAll('.receipt-image')) as HTMLImageElement[];
                for (const ri of receiptImgs) {
                    const src = ri.getAttribute('src') || '';
                    if (src.startsWith('data:application/pdf')) {
                        const note = document.createElement('div');
                        note.textContent = 'PDF anexado (não é exibido no PDF).';
                        (note as HTMLElement).setAttribute('style', 'font-size:12px;color:#555;margin-top:6px;');
                        ri.replaceWith(note);
                    }
                }
            } catch {}
            
            const pdfConfig = {
                margin: [10, 10, 15, 10], // top, left, bottom, right
                filename: `${report.numero}-relatorio-viagem.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { 
                    mode: ['css', 'legacy'], // Permite controle de quebra de página
                    before: 'h2', // Quebra antes de todos os H2
                }
            };

            // 4. Geração
            const pdfGenerator = html2pdf().set(pdfConfig).from(element).outputPdf('blob');
            const pdfBlob = await pdfGenerator;
            
            // 5. Download opcional
            if (download) {
                triggerDownload(pdfBlob, pdfConfig.filename);
            }

            return pdfBlob as Blob;
        } catch (e) {
            console.error('Erro na geração do PDF:', e);
            alert('Erro ao gerar o PDF. Verifique os anexos e tente novamente.');
            return null;
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    // JSX PRINCIPAL: Usando o Layout Web
    return (
        <Layout>
            {/* Modal de visualização de PDF */}
            <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Visualização do Relatório</DialogTitle>
                    </DialogHeader>
                    {pdfModalUrl ? (
                        <iframe src={pdfModalUrl} className="w-full h-full border rounded-lg" title="Relatório PDF" />
                    ) : (
                        <p className="text-center text-gray-500 py-10">Carregando PDF...</p>
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex h-[calc(100vh-64px)] p-6 gap-6">
                {/* Painel Esquerdo: Rascunhos e Histórico */}
                <div className="w-1/3 space-y-6 flex flex-col">
                    <div className="flex-1 min-h-[45%] max-h-[50%]">
                        <DraftsList
                            visibleReports={visibleReports}
                            selectedCliente={selectedCliente}
                            setSelectedCliente={setSelectedCliente}
                            allClienteFolders={allClienteFolders}
                            createNewReport={createNewReport}
                            setCurrentReport={setCurrentReport}
                            deleteReport={deleteReport}
                        />
                    </div>
                    <div className="flex-1 min-h-[45%] max-h-[50%]">
                        <HistoryList
                            history={history}
                            openPdfModal={openPdfModal}
                            loadingHistory={loadingHistory}
                            refreshHistory={refreshHistory}
                            deleteHistoryItem={deleteHistoryItem}
                        />
                    </div>
                </div>

                {/* Painel Central: Formulário de Edição/Visualização */}
                <div className="w-2/3 border rounded-lg overflow-y-auto bg-gray-50 shadow-lg relative">
                    {/* Barra de Ações Fixa */}
                    <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center shadow-sm">
                        <Button 
                            variant="outline" 
                            onClick={() => { setCurrentReport(null); setIsCreating(false); }}
                            disabled={isGeneratingPdf || isSending}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para Listagem
                        </Button>
                        <div className="space-x-2">
                            {currentReport && currentReport.status !== 'finalized' && (
                                <>
                                    <Button 
                                        onClick={() => saveReport('draft')} 
                                        disabled={isGeneratingPdf || isSending} 
                                        variant="secondary"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Rascunho
                                    </Button>
                                    <Button 
                                        onClick={() => saveReport('finalized')} 
                                        disabled={isGeneratingPdf || isSending || !currentReport.cliente || !currentReport.aeronave}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {isGeneratingPdf || isSending ? 'Finalizando...' : 'Finalizar e Enviar'}
                                    </Button>
                                </>
                            )}
                            {currentReport && currentReport.status === 'finalized' && (
                                <Button 
                                    onClick={async () => {
                                        const url = await getReportPdfUrl(currentReport);
                                        if (url) openPdfModal(url);
                                    }} 
                                    variant="outline"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver PDF Salvo
                                </Button>
                            )}
                        </div>
                    </div>

                    <ReportFormUI 
                        currentReport={currentReport} 
                        handleInputChange={handleInputChange} 
                        handleDespesaChange={handleDespesaChange} 
                        addDespesa={addDespesa} 
                        removeDespesa={removeDespesa} 
                        handleFileUpload={handleFileUpload}
                        calculateDays={calculateDays}
                        CATEGORIAS_DESPESA={CATEGORIAS_DESPESA}
                        PAGADORES={PAGADORES}
                        uploadingIndex={uploadingIndex}
                        cliente={cliente}
                        aeronaves={aeronaves}
                        uniqueTripulantes={uniqueTripulantes}
                        showSecondTripulante={showSecondTripulante}
                        setShowSecondTripulante={setShowSecondTripulante}
                        deleteCreatedReport={deleteCreatedReport}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default TravelReports;