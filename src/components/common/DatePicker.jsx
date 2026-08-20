import React from 'react';
import { id } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal..." }) {
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  const handleSelect = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  const formattedDisplay = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : placeholder;

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger className="w-full block">
          <Button
            type="button"
            variant="outline"
            className="w-full h-[52px] flex items-center justify-between text-left font-bold text-base border-2 border-input rounded-xl touch-btn px-4 bg-background"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
              <span className={value ? "text-foreground font-bold truncate" : "text-muted-foreground font-semibold truncate"}>
                {formattedDisplay}
              </span>
            </div>
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground shrink-0 ml-1"
                title="Hapus tanggal"
              >
                <X className="size-4" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[calc(100vw-2rem)] max-w-xs p-3 bg-card border-2 border-primary/30 rounded-2xl shadow-2xl z-50 overflow-hidden"
        >
          <Calendar
            mode="single"
            locale={id}
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
            className="mx-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
