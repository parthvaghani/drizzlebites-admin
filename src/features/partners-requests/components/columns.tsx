import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useDeletePartnershipRequest } from '@/hooks/use-partnership-requests';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface PartnershipRequestRow {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    company?: string;
    message?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export const columns: ColumnDef<PartnershipRequestRow>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
            const name = row.getValue('name') as string;
            return <div className="font-medium">{name}</div>;
        },
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
            const email = row.getValue('email') as string;
            return <div className="text-sm text-muted-foreground">{email}</div>;
        },
    },
    {
        accessorKey: 'phoneNumber',
        header: 'Phone',
        cell: ({ row }) => {
            const phoneNumber = row.getValue('phoneNumber') as string;
            return <div className="text-sm">{phoneNumber || '-'}</div>;
        },
    },
    {
        accessorKey: 'company',
        header: 'Additional Info',
        cell: ({ row }) => {
            const company = row.getValue('company') as string;
            const maxLength = 600; // reduced length to prevent scroll
            const truncated = company?.length > maxLength ? `${company.slice(0, maxLength)}...` : company || '—';
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="truncate block max-w-[900px] text-sm text-muted-foreground cursor-help">{truncated}</span>
                        </TooltipTrigger>
                        {company && (
                            <TooltipContent className="max-w-xs">
                                <p>{company}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const partnershipRequest = row.original;
            const deletePartnershipRequest = useDeletePartnershipRequest();

            const handleDelete = async () => {
                try {
                    await deletePartnershipRequest.mutateAsync(partnershipRequest._id);
                    toast.success('Partnership request deleted successfully');
                } catch (error) {
                    toast.error('Failed to delete partnership request');
                }
            };

            return (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deletePartnershipRequest.isPending}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <span className="sr-only">Delete partnership request</span>
                    <Trash2 className="h-4 w-4" />
                </Button>
            );
        },
    },
];
