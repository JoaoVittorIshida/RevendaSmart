import React, { useState } from 'react';
import { Camera, KeyRound, LockKeyhole, Save, ShieldCheck, Store, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { convertImageToWebp, validateImageFile } from '../utils/image';

const MinhaConta = () => {
    const { usuario, atualizarConta, alterarSenha } = useAuth();
    const toast = useToast();
    const [account, setAccount] = useState({ nome: usuario?.nome || '', nomeLoja: usuario?.nomeLoja || '', fotoPerfil: usuario?.fotoPerfil || '' });
    const [password, setPassword] = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
    const [savingAccount, setSavingAccount] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const saveAccount = async (event) => {
        event.preventDefault(); setSavingAccount(true);
        const result = await atualizarConta(account); setSavingAccount(false);
        result.success ? toast.success('Dados atualizados', 'Suas informações de conta foram salvas.') : toast.error('Não foi possível salvar', result.message);
    };
    const savePassword = async (event) => {
        event.preventDefault();
        if (password.novaSenha !== password.confirmarNovaSenha) return toast.error('Confirmação diferente', 'A confirmação deve ser igual à nova senha.');
        if (password.novaSenha.length < 8) return toast.error('Senha muito curta', 'A nova senha deve ter pelo menos 8 caracteres.');
        setSavingPassword(true); const result = await alterarSenha(password); setSavingPassword(false);
        if (result.success) { setPassword({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' }); toast.success('Senha atualizada', 'Sua nova senha já está em uso.'); }
        else toast.error('Não foi possível trocar a senha', result.message);
    };
    const selectPhoto = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const validationError = validateImageFile(file);
        if (validationError) return toast.error('Imagem inválida', validationError);
        try { const fotoPerfil = await convertImageToWebp(file, { maxDimension: 480, quality: 0.82 }); setAccount((current) => ({ ...current, fotoPerfil })); }
        catch { toast.error('Não foi possível processar a imagem', 'Tente escolher outro arquivo.'); }
        finally { event.target.value = ''; }
    };

    return <div className="container max-w-4xl"><div className="page-header"><div><h1 className="page-title">Minha Conta</h1><p className="page-subtitle">Gerencie seus dados pessoais, identidade da loja e acesso.</p></div></div><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="card"><div className="flex gap-3 items-start"><div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30"><UserRound className="text-blue-600" /></div><div><h2 className="section-heading">Informações básicas</h2><p className="text-sm text-slate-500 mt-1">A foto e o nome da loja aparecem no menu e no catálogo público.</p></div></div><form className="mt-6 space-y-4" onSubmit={saveAccount}><div><label className="label">Foto de perfil da loja <span className="font-normal text-slate-400">(opcional)</span></label><div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-700">{account.fotoPerfil ? <img src={account.fotoPerfil} alt="Prévia da foto da loja" className="h-full w-full object-cover" /> : <Store size={28} />}</div><div className="flex flex-wrap gap-2"><label className="btn btn-secondary cursor-pointer"><Camera size={17} />{account.fotoPerfil ? 'Trocar foto' : 'Adicionar foto'}<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto} /></label>{account.fotoPerfil && <button type="button" className="btn btn-secondary text-red-600" onClick={() => setAccount({ ...account, fotoPerfil: '' })}><Trash2 size={16} />Remover</button>}</div></div><p className="mt-2 text-xs text-slate-500">PNG, JPG ou WEBP. Será convertida para WEBP otimizado antes de salvar.</p></div><div><label className="label" htmlFor="nome-completo">Nome completo</label><input id="nome-completo" required maxLength="255" className="input" value={account.nome} onChange={(event) => setAccount({ ...account, nome: event.target.value })} /></div><div><label className="label" htmlFor="nome-loja">Nome da Loja <span className="font-normal text-slate-400">(opcional)</span></label><div className="relative"><Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input id="nome-loja" maxLength="100" className="input pl-10" value={account.nomeLoja} onChange={(event) => setAccount({ ...account, nomeLoja: event.target.value })} placeholder="Ex.: Tech do João" /></div><p className="text-xs text-slate-500 mt-2">O nome é obrigatório para publicar a Vitrine e não pode ser apagado enquanto ela estiver ativa.</p></div><button disabled={savingAccount} className="btn btn-primary">{savingAccount ? 'Salvando...' : <><Save size={17} />Salvar dados</>}</button></form></section><section className="card border-amber-200 dark:border-amber-900"><div className="flex gap-3 items-start"><div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30"><KeyRound className="text-amber-600" /></div><div><h2 className="section-heading">Segurança</h2><p className="text-sm text-slate-500 mt-1">Confirme sua senha atual antes de definir uma nova.</p></div></div><form className="mt-6 space-y-4" onSubmit={savePassword}><div><label className="label" htmlFor="senha-atual">Senha atual</label><div className="relative"><LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input id="senha-atual" required type="password" autoComplete="current-password" className="input pl-10" value={password.senhaAtual} onChange={(event) => setPassword({ ...password, senhaAtual: event.target.value })} /></div></div><div><label className="label" htmlFor="nova-senha">Nova senha</label><input id="nova-senha" required type="password" minLength="8" maxLength="255" autoComplete="new-password" className="input" value={password.novaSenha} onChange={(event) => setPassword({ ...password, novaSenha: event.target.value })} /></div><div><label className="label" htmlFor="confirmar-senha">Confirmar nova senha</label><input id="confirmar-senha" required type="password" minLength="8" maxLength="255" autoComplete="new-password" className="input" value={password.confirmarNovaSenha} onChange={(event) => setPassword({ ...password, confirmarNovaSenha: event.target.value })} /></div><div className="flex gap-2 text-xs text-slate-500"><ShieldCheck size={16} className="text-amber-600 shrink-0" /><p>A senha atual é conferida no servidor; a nova senha é armazenada somente como hash.</p></div><button disabled={savingPassword} className="btn btn-secondary border-amber-300 text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/20">{savingPassword ? 'Atualizando...' : <><KeyRound size={17} />Alterar senha</>}</button></form></section></div></div>;

};
export default MinhaConta;
