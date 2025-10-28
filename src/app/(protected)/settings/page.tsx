import { prisma } from "@/lib/db";
import { OverheadForm } from "@/components/settings/overhead-form";
import { TotpSetup } from "@/components/settings/totp-setup";
import { Card, CardContent, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { format } from "date-fns";

async function getSettings() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((setting) => [setting.key, Number(setting.value ?? 0)]));
  return {
    gas: map.gas ?? Number(process.env.OVERHEAD_GAS ?? 0),
    energy: map.energy ?? Number(process.env.OVERHEAD_ENERGY ?? 0),
    water: map.water ?? Number(process.env.OVERHEAD_WATER ?? 0),
    packaging: map.packaging ?? Number(process.env.OVERHEAD_PACKAGING ?? 0),
  };
}

async function getUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    totpEnabled: Boolean(user.totpSecret),
    createdAt: user.createdAt,
  }));
}

export default async function SettingsPage() {
  const [overhead, users] = await Promise.all([getSettings(), getUsers()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-slate-500">Ajuste custos fixos, usuários e integrações externas.</p>
      </div>
      <OverheadForm defaults={overhead} />
      <TotpSetup />
      <Card>
        <CardHeader>
          <CardTitle>Usuários e 2FA</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Nome</TH>
                <TH>E-mail</TH>
                <TH>Perfil</TH>
                <TH>2FA</TH>
                <TH>Criado em</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((user) => (
                <TR key={user.id}>
                  <TD>{user.name}</TD>
                  <TD>{user.email}</TD>
                  <TD>{user.role}</TD>
                  <TD>{user.totpEnabled ? "Ativo" : "Desativado"}</TD>
                  <TD>{format(user.createdAt, "dd/MM/yyyy")}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <p className="mt-4 text-xs text-slate-500">
            Para habilitar 2FA, acesse o perfil do usuário no cliente e utilize um app TOTP (Authy, Google Authenticator).
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Power BI / Somente leitura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Conecte-se ao PostgreSQL com um usuário read-only e utilize as views dim_date, v_fct_sales, v_fct_production, v_fct_inventory, v_fct_expenses e v_fct_cashbook.</p>
          <div className="rounded-lg border border-dashed border-slate-300 p-4 font-mono text-xs">
            {process.env.DATABASE_URL ? `${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':******@')}` : 'Configure DATABASE_URL no ambiente'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
