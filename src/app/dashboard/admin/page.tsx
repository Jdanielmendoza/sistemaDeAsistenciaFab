import { TableAdmin } from '@/components/table-admin'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link';


const admin = async() => {
  return (
    <div>
      <section className='w-full mt-10 mb-5 flex justify-between' >
        <Input type='search' className='max-w-60'  />
        <Button> <Link href="admin/crear" >Nuevo admin</Link> </Button>
      </section>
      <div className="rounded overflow-hidden" >
      <TableAdmin/>
      </div>
    </div>
  )
}

export default admin