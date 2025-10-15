import { cn } from '@/lib/utils';
import { useIsFetching } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

interface ContentLoaderProps {
    active?: boolean;
    className?: string;
}

export function ContentLoader({ active, className }: ContentLoaderProps) {
    const routerState = useRouterState();
    const numFetching = useIsFetching();

    const isActive =
        typeof active === 'boolean'
            ? active
            : routerState.status === 'pending' || numFetching > 0;

    return (
        <div
            className={cn(
                'pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm',
                !isActive && 'hidden',
                className
            )}
        >
            <div className="flex flex-col items-center gap-3">
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="h-18 w-18 object-contain animate-bounce"
                />
                <div className="text-2xl font-bold text-[#257112]">Aavkar Mukhwas</div>
            </div>
        </div>
    );
}
