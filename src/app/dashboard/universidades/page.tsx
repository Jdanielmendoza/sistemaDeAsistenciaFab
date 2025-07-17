'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Search } from 'lucide-react';

interface University {
  id: string;
  name: string;
}

export default function UniversityPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [current, setCurrent] = useState<University | null>(null);
  const [name, setName] = useState('');

  const fetchUniversities = async () => {
    try {
      const res = await fetch('/api/university');
      const data = await res.json();
      setUniversities(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const openNew = () => {
    setCurrent(null);
    setName('');
    setIsDialogOpen(true);
  };

  const openEdit = (u: University) => {
    setCurrent(u);
    setName(u.name);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (current) {
        // update
        await fetch('/api/university', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, name }),
        });
        toast.success('Universidad actualizada');
      } else {
        // create
        await fetch('/api/university', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        toast.success('Universidad creada');
      }
      setIsDialogOpen(false);
      fetchUniversities();
    } catch (e) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (u: University) => {
    if (!confirm('¿Eliminar universidad?')) return;
    try {
      await fetch('/api/university', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id }),
      });
      toast.success('Eliminada');
      fetchUniversities();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar universidad..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nueva
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(u)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(u)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{current ? 'Editar' : 'Nueva'} Universidad</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSave}>{current ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 