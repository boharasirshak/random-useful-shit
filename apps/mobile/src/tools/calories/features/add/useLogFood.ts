// Adding food from anywhere in Add Food: log it, buzz, and remember it for Undo.
import { byId } from '@/tools/calories/data/menu';
import { orderKey, totalKcal, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { success, thud, warning } from '@/ui/haptics';

export function useLogFood() {
  const { day, meal, added, setAdded } = useUi();
  const addFood = useApp(s => s.addFood);
  const undoFood = useApp(s => s.undoFood);
  const target = useBudget();
  return {
    added,
    // A warning buzz instead of success when this takes the day over target. times: e.g. two plates at once.
    add: (o: Order, times = 1) => {
      useUi.getState().rollover();
      useUi.getState().hideRecent(orderKey(o), false);
      const { day, meal } = useUi.getState();
      for (let i = 0; i < times; i++) addFood(day, { meal, ...o });
      const s = useApp.getState();
      (target != null && totalKcal(s.logs[day], s.shake) > target ? warning : success)();
      setAdded({ order: o, label: `${times > 1 ? `${times}× ` : ''}${o.name ?? byId[o.parts[0].id]?.name ?? 'Food'}`, at: Date.now() });
    },
    undo: () => {
      if (!added) return;
      thud();
      undoFood(day, { meal, ...added.order });
      setAdded(null);
    },
    dismiss: () => setAdded(null),
  };
}
