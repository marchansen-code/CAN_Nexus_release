import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export const GroupMentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ 
        id: item.group_id, 
        label: item.name 
      });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
        Keine Gruppen gefunden
      </div>
    );
  }

  return (
    <div className="bg-popover border rounded-lg shadow-lg overflow-hidden min-w-[220px]">
      <div className="p-2 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Gruppen-Erwähnung
        </span>
      </div>
      <div className="max-h-[250px] overflow-y-auto">
        {props.items.map((item, index) => (
          <button
            key={item.group_id}
            onClick={() => selectItem(index)}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
              index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-muted'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.name}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                  Gruppe
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {item.member_count} {item.member_count === 1 ? 'Mitglied' : 'Mitglieder'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

GroupMentionList.displayName = 'GroupMentionList';
