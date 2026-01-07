import { useItems, useDeleteItem } from "@/hooks/use-items";
import { ItemCard } from "@/components/item-card";
import { CreateItemDialog } from "@/components/create-item-dialog";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LayoutGrid, AlertCircle } from "lucide-react";

export default function Home() {
  const { data: items, isLoading, error } = useItems();
  const deleteItem = useDeleteItem();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">App Name</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/" className="text-foreground">Overview</Link>
            <Link href="/mc2" className="text-muted-foreground hover:text-foreground transition-colors">MC2</Link>
          </nav>

          <div className="md:hidden">
            <Link href="/mc2" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              MC2
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Dashboard</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Manage your collection of items in a minimal, focused interface.
            </p>
          </div>
          <CreateItemDialog />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load items</h3>
            <p className="text-muted-foreground max-w-md">{error.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {items?.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center bg-secondary/30 rounded-2xl border border-dashed border-border"
                >
                  <p className="text-muted-foreground">No items found. Create your first one above.</p>
                </motion.div>
              ) : (
                items?.map((item) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onDelete={(id) => deleteItem.mutate(id)}
                    isDeleting={deleteItem.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
