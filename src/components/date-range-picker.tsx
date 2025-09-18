import { useEffect, useMemo } from 'react';
import {
    format,
    startOfDay,
    endOfDay,
    subDays,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';

interface Props {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    disableFuture?: boolean;
    showPresets?: boolean;
}

export function DateRangePicker({
    value,
    onChange,
    placeholder = 'Select date range',
    disableFuture = true,
    showPresets = true,
}: Props) {
    useEffect(() => {
        if (!value) {
            const now = new Date();
            onChange({ from: startOfMonth(now), to: endOfDay(now) });
        }
    }, [value, onChange]);
    const label = useMemo(() => {
        if (value?.from && value?.to) {
            return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`;
        }
        if (value?.from) {
            return `${format(value.from, 'MMM d, yyyy')} - ...`;
        }
        return placeholder;
    }, [value, placeholder]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant='outline'
                    data-empty={!value?.from}
                    className='data-[empty=true]:text-muted-foreground w-[300px] justify-start text-left font-normal'
                >
                    {label}
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0'>
                <Calendar
                    mode='range'
                    captionLayout='dropdown'
                    selected={value}
                    onSelect={(range) => {
                        if (!range) {
                            onChange(undefined);
                            return;
                        }
                        const now = new Date();
                        const clampStart = startOfDay(now);
                        const clampEnd = endOfDay(now);

                        let from = range.from ?? undefined;
                        let to = (range.to ?? range.from) ?? undefined;

                        if (from && from > now) {
                            from = clampStart;
                        }
                        if (to && to > now) {
                            to = clampEnd;
                        }
                        if (from && to && from > to) {
                            from = startOfDay(to);
                        }

                        onChange(from ? { from, to } : undefined);
                    }}
                    numberOfMonths={2}
                    disabled={(date: Date) =>
                        (disableFuture && date > new Date()) || date < new Date('1900-01-01')
                    }
                />
                {showPresets && (
                    <div className='border-t p-2 grid grid-cols-2 gap-2'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const today = new Date();
                                onChange({ from: startOfDay(today), to: endOfDay(today) });
                            }}
                        >
                            Today
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const to = endOfDay(new Date());
                                const from = startOfDay(subDays(to, 6));
                                onChange({ from, to });
                            }}
                        >
                            Last 7 days
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const to = endOfDay(new Date());
                                const from = startOfDay(subDays(to, 29));
                                onChange({ from, to });
                            }}
                        >
                            Last 30 days
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const now = new Date();
                                onChange({ from: startOfMonth(now), to: endOfDay(now) });
                            }}
                        >
                            This month
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const now = new Date();
                                const lastMonth = subMonths(now, 1);
                                onChange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                            }}
                        >
                            Last month
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                const now = new Date();
                                onChange({ from: startOfYear(now), to: endOfDay(now) });
                            }}
                        >
                            YTD
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            className='col-span-2'
                            onClick={() => onChange(undefined)}
                        >
                            Clear
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default DateRangePicker


