import { motion } from "framer-motion";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import type { Item } from "@shared/schema";

interface ItemCardProps {
  item: Item;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function ItemCard({ item, onDelete, isDeleting }: ItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative bg-card hover:bg-card/80 border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
          {item.name}
        </h3>
        <button
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 -mt-2 rounded-full hover:bg-muted"
          aria-label="Delete item"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
        {item.description || "No description provided."}
      </p>
      
      <div className="flex items-center text-xs text-muted-foreground/60 font-medium">
        {item.createdAt && format(new Date(item.createdAt), "MMM d, yyyy")}
      </div>
    </motion.div>
  );
}
