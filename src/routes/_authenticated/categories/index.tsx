import Categories from '@/features/categories';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/categories/')({
    component: Categories,
});