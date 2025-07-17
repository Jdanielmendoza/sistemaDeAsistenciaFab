'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Calendar, Clock } from 'lucide-react';

interface ScheduleRow {
  id_schedule: string;
  user_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const dayLbl = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export default function HorariosPage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<ScheduleRow | null>(null);
  const [day, setDay] = useState('1');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('12:00');

  const load = async () => {
    const res = await fetch('/api/schedule');
    const data = await res.json();
    // backend query should include user_name, else map later
    setRows(
      data.map((d: any) => ({
        id_schedule: d.id_schedule,
        user_name: d.name ?? 'Usuario',
        day_of_week: d.day_of_week,
        start_time: d.start_time.substring(0, 5),
        end_time: d.end_time.substring(0, 5),
      }))
    );
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setCurrent(null); setDay('1'); setStart('08:00'); setEnd('12:00'); setDialogOpen(true); };
  const openEdit = (r: ScheduleRow) => { setCurrent(r); setDay(String(r.day_of_week)); setStart(r.start_time); setEnd(r.end_time); setDialogOpen(true); };

  const save = async () => {
    try {
      if (current) {
        await fetch('/api/schedule', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_schedule: current.id_schedule, day_of_week: Number(day), start_time: start, end_time: end })
        });
        toast.success('Horario actualizado');
      } else {
        toast.info('Para crear usa el wizard de voluntarios');
      }
      setDialogOpen(false); load();
    } catch { toast.error('Error al guardar'); }
  };

  const remove = async (r: ScheduleRow) => {
    if (!confirm('Eliminar horario?')) return;
    try {
      await fetch('/api/schedule', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_schedule: r.id_schedule }) });
      toast.success('Eliminado'); load();
    } catch { toast.error('Error'); }
  };

  const filtered = rows.filter(r => r.user_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-indigo"><Calendar className="h-6 w-6"/> Horarios</h1>
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar voluntario..." value={search} onChange={e=>setSearch(e.target.value)} className="max-w-sm" />
        <Button onClick={openNew} disabled className="opacity-50 cursor-not-allowed"><Plus className="h-4 w-4 mr-2"/>Nuevo</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voluntario</TableHead>
              <TableHead>Día</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r=>(
              <TableRow key={r.id_schedule}>
                <TableCell>{r.user_name}</TableCell>
                <TableCell>{dayLbl[r.day_of_week-1]}</TableCell>
                <TableCell>{r.start_time}</TableCell>
                <TableCell>{r.end_time}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="icon" variant="outline" onClick={()=>openEdit(r)}><Edit className="h-4 w-4"/></Button>
                  <Button size="icon" variant="destructive" onClick={()=>remove(r)}><Trash className="h-4 w-4"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle><Clock className="h-4 w-4 mr-1 inline"/>{current?'Editar':'Nuevo'} horario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <label className="flex flex-col text-sm flex-1">Día
                <select value={day} onChange={e=>setDay(e.target.value)} className="border rounded p-2">
                  {dayLbl.map((d,i)=>(<option key={i} value={i+1}>{d}</option>))}
                </select>
              </label>
              <label className="flex flex-col text-sm flex-1">Inicio
                <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border rounded p-2"/>
              </label>
              <label className="flex flex-col text-sm flex-1">Fin
                <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border rounded p-2"/>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>{current?'Actualizar':'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 