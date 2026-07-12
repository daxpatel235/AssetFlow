'use client';
import { useState } from 'react';
import {
  Building2, Plus, Users, Network, LayoutGrid, ChevronRight, Pencil, Layers, Power, UserPlus, Shield, X,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, SearchBar, Select, Field, Input, Textarea, Badge, EmptyState } from '@/components/ui/kit';
import { Modal, useConfirm } from '@/components/ui/Modal';
import { Tabs, Segmented } from '@/components/assetflow/ui';
import { RoleBadge, StatusPill, categoryIcon } from '@/components/assetflow/badges';
import { RoleGate } from '@/components/assetflow/RoleGate';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import {
  departments, categories, employees, departmentName, employeeName,
  type Role, type Department, type Category,
} from '@/lib/mock/assetflow';

const ROLE_OPTS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'asset_manager', label: 'Asset Manager' },
  { value: 'dept_head', label: 'Department Head' },
  { value: 'employee', label: 'Employee' },
];

type ModalState =
  | null
  | { type: 'dept' }
  | { type: 'editDept'; dept: Department }
  | { type: 'category' }
  | { type: 'editCat'; cat: Category }
  | { type: 'employee' };

export default function OrganizationPage() {
  const { perms } = useAF();
  return (
    <RoleGate allowed={perms.manageOrg} title="Organization Setup — Admin only">
      <OrganizationInner />
    </RoleGate>
  );
}

function OrganizationInner() {
  const toast = useToast();
  const confirm = useConfirm();
  const af = useAF();
  const [tab, setTab] = useState('departments');
  const [deptView, setDeptView] = useState<'cards' | 'hierarchy'>('cards');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [catFields, setCatFields] = useState<{ name: string; type: 'text' | 'number' | 'date' | 'boolean' }[]>([]);

  const filteredEmp = employees.filter((e) => {
    if (roleFilter && e.role !== roleFilter) return false;
    if (q) { const s = q.toLowerCase(); return e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s); }
    return true;
  });

  async function onDeactivateDept(d: Department) {
    const on = d.status === 'active';
    const ok = await confirm({
      title: on ? `Deactivate ${d.name}?` : `Reactivate ${d.name}?`,
      message: on ? 'Deactivated departments are hidden from new allocations and bookings.' : 'This department will be selectable again.',
      confirmLabel: on ? 'Deactivate' : 'Reactivate',
      danger: on,
    });
    if (!ok) return;
    af.toggleDepartmentStatus(d.id);
    toast.success(`${d.name} ${on ? 'deactivated' : 'reactivated'}`);
  }

  async function onToggleEmp(id: string, name: string, active: boolean) {
    const ok = await confirm({
      title: active ? `Deactivate ${name}?` : `Reactivate ${name}?`,
      message: active ? 'They will keep their record but lose access.' : 'They will regain access.',
      confirmLabel: active ? 'Deactivate' : 'Reactivate',
      danger: active,
    });
    if (!ok) return;
    af.toggleEmployeeStatus(id);
    toast.success(`${name} ${active ? 'deactivated' : 'reactivated'}`);
  }

  return (
    <div>
      <PageHeader title="Organization Setup" subtitle="Master data: departments, asset categories and the employee directory">
        {tab === 'departments' && <Button onClick={() => setModal({ type: 'dept' })}><Plus className="w-4 h-4" /> New Department</Button>}
        {tab === 'categories' && <Button onClick={() => { setCatFields([]); setModal({ type: 'category' }); }}><Plus className="w-4 h-4" /> New Category</Button>}
        {tab === 'employees' && <Button onClick={() => setModal({ type: 'employee' })}><UserPlus className="w-4 h-4" /> Add Employee</Button>}
      </PageHeader>

      <Tabs className="mb-6" active={tab} onChange={setTab}
        tabs={[{ value: 'departments', label: 'Departments', count: departments.length }, { value: 'categories', label: 'Asset Categories', count: categories.length }, { value: 'employees', label: 'Employee Directory', count: employees.length }]}
      />

      {/* ── Departments ── */}
      {tab === 'departments' && (
        <div>
          <div className="flex justify-end mb-4">
            <Segmented options={[{ value: 'cards', label: 'Cards', icon: LayoutGrid }, { value: 'hierarchy', label: 'Hierarchy', icon: Network }]} value={deptView} onChange={setDeptView} />
          </div>
          {deptView === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => (
                <Card key={d.id} className={`transition ${d.status === 'active' ? 'hover:border-brand/40' : 'opacity-70'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand/10 text-brand"><Building2 className="w-5 h-5" /></span>
                    <div className="flex items-center gap-1.5">
                      <StatusPill tone={d.status === 'active' ? 'green' : 'slate'} label={d.status} dot={false} />
                    </div>
                  </div>
                  <p className="font-semibold text-fg">{d.name}</p>
                  <p className="text-xs text-fg-muted font-mono">{d.code}</p>
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-fg-muted">Head</span><span className="flex items-center gap-1.5"><Avatar name={employeeName(d.headId)} size="sm" />{employeeName(d.headId)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-fg-muted">Parent</span><span className="text-fg">{d.parentId ? departmentName(d.parentId) : '—'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-fg-muted">Employees</span><span className="font-semibold text-fg">{d.employeeCount}</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setModal({ type: 'editDept', dept: d })}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeactivateDept(d)} className={d.status === 'active' ? 'text-red-600 dark:text-red-400' : ''}><Power className="w-3.5 h-3.5" /> {d.status === 'active' ? 'Deactivate' : 'Reactivate'}</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : <DeptHierarchy />}
        </div>
      )}

      {/* ── Categories ── */}
      {tab === 'categories' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = categoryIcon(c.icon);
            return (
              <Card key={c.id} className="hover:border-brand/40 transition">
                <div className="flex items-start justify-between mb-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"><Icon className="w-5 h-5" /></span>
                  <button className="text-fg-muted hover:text-fg" onClick={() => setModal({ type: 'editCat', cat: c })} aria-label="Edit category"><Pencil className="w-4 h-4" /></button>
                </div>
                <p className="font-semibold text-fg">{c.name}</p>
                <p className="text-sm text-fg-muted mt-0.5">{c.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-fg-muted"><Layers className="w-3.5 h-3.5" /> {c.assetCount} assets</div>
                {c.fields.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted mb-2">Custom fields</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.fields.map((f) => <Badge key={f.name} tone="gray">{f.name}{f.required ? ' *' : ''}</Badge>)}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Employees ── */}
      {tab === 'employees' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <SearchBar value={q} onChange={setQ} placeholder="Search name or email…" />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} options={ROLE_OPTS} placeholder="All roles" className="w-auto min-w-[10rem]" />
          </div>
          <Card className="p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-fg-muted"><tr>{['Employee', 'Department', 'Title', 'Status', 'Role / Promote', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredEmp.map((e) => (
                    <tr key={e.id} className="border-t border-border hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><div className="min-w-0"><p className="font-medium text-fg truncate">{e.name}</p><p className="text-xs text-fg-muted truncate">{e.email}</p></div></div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{departmentName(e.departmentId)}</td>
                      <td className="px-4 py-3 text-fg-muted">{e.title}</td>
                      <td className="px-4 py-3"><StatusPill tone={e.status === 'active' ? 'green' : 'slate'} label={e.status} dot={false} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RoleBadge role={e.role} />
                          <Select value={e.role} onChange={(ev) => { af.setEmployeeRole(e.id, ev.target.value as Role); toast.success(`${e.name} → ${ROLE_OPTS.find((r) => r.value === ev.target.value)?.label}`); }} options={ROLE_OPTS} placeholder="" className="w-auto min-w-[9rem] py-1.5 text-xs" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onToggleEmp(e.id, e.name, e.status === 'active')} className={`text-xs font-medium hover:underline ${e.status === 'active' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{e.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filteredEmp.length && <EmptyState icon={Users} title="No employees match" />}
          </Card>

          {/* Mobile: employee cards */}
          <div className="md:hidden space-y-3">
            {filteredEmp.length ? filteredEmp.map((e) => (
              <Card key={e.id} className="flex items-center gap-3">
                <Avatar name={e.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg truncate">{e.name}</p>
                  <p className="text-xs text-fg-muted truncate">{e.title} · {departmentName(e.departmentId)}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <RoleBadge role={e.role} />
                    <StatusPill tone={e.status === 'active' ? 'green' : 'slate'} label={e.status} dot={false} />
                  </div>
                </div>
                <Select value={e.role} onChange={(ev) => af.setEmployeeRole(e.id, ev.target.value as Role)} options={ROLE_OPTS} placeholder="" className="w-auto min-w-[8rem] py-1.5 text-xs shrink-0" />
              </Card>
            )) : <Card><EmptyState icon={Users} title="No employees match" /></Card>}
          </div>
          <p className="mt-3 text-xs text-fg-muted flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> This is the only place roles are assigned — signup always creates a plain Employee.</p>
        </div>
      )}

      {/* New / Edit department modal */}
      <Modal open={modal?.type === 'dept' || modal?.type === 'editDept'} onClose={() => setModal(null)} title={modal?.type === 'editDept' ? 'Edit Department' : 'New Department'} width="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get('name') || '').trim();
          const code = String(fd.get('code') || '').trim();
          const headId = String(fd.get('headId') || '');
          const parentId = String(fd.get('parentId') || '') || null;
          if (!name) return;
          if (modal?.type === 'editDept') { af.updateDepartment(modal.dept.id, { name, code, headId, parentId }); toast.success('Department updated'); }
          else { af.addDepartment({ name, code, headId: headId || employees[0].id, parentId }); toast.success('Department created'); }
          setModal(null);
        }}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Name"><Input name="name" defaultValue={modal?.type === 'editDept' ? modal.dept.name : ''} placeholder="e.g. Marketing" required /></Field>
            <Field label="Code"><Input name="code" defaultValue={modal?.type === 'editDept' ? modal.dept.code : ''} placeholder="e.g. MKT" /></Field>
          </div>
          <Field label="Department head"><Select name="headId" defaultValue={modal?.type === 'editDept' ? modal.dept.headId : ''} options={employees.map((e) => ({ value: e.id, label: e.name }))} placeholder="Select head" /></Field>
          <Field label="Parent department"><Select name="parentId" defaultValue={modal?.type === 'editDept' ? (modal.dept.parentId ?? '') : ''} options={departments.filter((d) => modal?.type !== 'editDept' || d.id !== modal.dept.id).map((d) => ({ value: d.id, label: d.name }))} placeholder="None (top-level)" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button type="submit">{modal?.type === 'editDept' ? 'Save changes' : 'Create'}</Button></div>
        </form>
      </Modal>

      {/* New / Edit category modal */}
      <Modal open={modal?.type === 'category' || modal?.type === 'editCat'} onClose={() => setModal(null)} title={modal?.type === 'editCat' ? 'Edit Asset Category' : 'New Asset Category'} width="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get('name') || '').trim();
          const description = String(fd.get('description') || '').trim();
          if (!name) return;
          if (modal?.type === 'editCat') { af.updateCategory(modal.cat.id, { name, description }); toast.success('Category updated'); }
          else { af.addCategory({ name, description, fields: catFields }); toast.success('Category created'); }
          setModal(null);
        }}>
          <Field label="Category name"><Input name="name" defaultValue={modal?.type === 'editCat' ? modal.cat.name : ''} placeholder="e.g. Networking Gear" required /></Field>
          <Field label="Description"><Textarea name="description" defaultValue={modal?.type === 'editCat' ? modal.cat.description : ''} placeholder="What belongs in this category?" /></Field>
          
          {modal?.type !== 'editCat' && (
            <Field label="Custom fields" hint="Add category-specific fields like warranty period.">
              <div className="space-y-2 mb-2">
                {catFields.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input 
                      value={f.name} 
                      onChange={(e) => { const nf = [...catFields]; nf[i].name = e.target.value; setCatFields(nf); }} 
                      placeholder="Field name" 
                      className="flex-1" 
                    />
                    <Select 
                      value={f.type} 
                      onChange={(e) => { const nf = [...catFields]; nf[i].type = e.target.value as any; setCatFields(nf); }} 
                      options={['text', 'number', 'date', 'boolean']} 
                      placeholder="Type" 
                      className="w-32" 
                    />
                    <button type="button" onClick={() => { const nf = [...catFields]; nf.splice(i, 1); setCatFields(nf); }} className="p-2 text-fg-muted hover:text-red-500 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCatFields([...catFields, { name: '', type: 'text' }])}>
                <Plus className="w-3 h-3" /> Add field
              </Button>
            </Field>
          )}

          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button type="submit">{modal?.type === 'editCat' ? 'Save changes' : 'Create'}</Button></div>
        </form>
      </Modal>

      {/* Add employee modal */}
      <Modal open={modal?.type === 'employee'} onClose={() => setModal(null)} title="Add Employee" width="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get('name') || '').trim();
          const email = String(fd.get('email') || '').trim();
          const departmentId = String(fd.get('departmentId') || '') || departments[0].id;
          const title = String(fd.get('title') || '').trim();
          if (!name || !email) return;
          af.addEmployee({ name, email, departmentId, title });
          toast.success(`${name} added as Employee`);
          setModal(null);
        }}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Full name"><Input name="name" placeholder="Jane Doe" required /></Field>
            <Field label="Email"><Input name="email" type="email" placeholder="jane@assetflow.io" required /></Field>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Department"><Select name="departmentId" options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="Select department" /></Field>
            <Field label="Job title"><Input name="title" placeholder="e.g. Analyst" /></Field>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-brand/5 border border-brand/20 px-3 py-2 mb-4 text-xs text-fg-muted"><Shield className="w-3.5 h-3.5 text-brand" /> New hires always start as <span className="font-semibold text-fg">Employee</span>. Promote them from the directory.</div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button type="submit"><UserPlus className="w-4 h-4" /> Add employee</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function DeptHierarchy() {
  const roots = departments.filter((d) => !d.parentId);
  const childrenOf = (id: string) => departments.filter((d) => d.parentId === id);
  const Node = ({ d, depth }: { d: Department; depth: number }) => (
    <div>
      <div className="flex items-center gap-2 py-2" style={{ paddingLeft: depth * 24 }}>
        {depth > 0 && <ChevronRight className="w-4 h-4 text-fg-muted" />}
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand/10 text-brand"><Building2 className="w-4 h-4" /></span>
        <span className="font-medium text-fg">{d.name}</span>
        <span className="text-xs text-fg-muted font-mono">{d.code}</span>
        <span className="text-xs text-fg-muted">· {employeeName(d.headId)}</span>
        {d.status !== 'active' && <StatusPill tone="slate" label="inactive" dot={false} />}
      </div>
      {childrenOf(d.id).map((c) => <Node key={c.id} d={c} depth={depth + 1} />)}
    </div>
  );
  return <Card>{roots.map((r) => <Node key={r.id} d={r} depth={0} />)}</Card>;
}
