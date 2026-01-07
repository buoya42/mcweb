import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Construction } from "lucide-react";

export default function MC2() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-lg z-10"
      >
        <div className="mx-auto w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-8 border border-border shadow-inner">
          <Construction className="w-10 h-10 text-muted-foreground" />
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
          MC2 Section
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          This is a designated placeholder area for the MC2 module. 
          Future development will expand this section with specialized functionality.
        </p>

        <Link href="/">
          <button className="inline-flex items-center px-8 py-3 rounded-full border border-border hover:border-foreground/20 hover:bg-secondary/50 transition-all duration-300 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Return Home</span>
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
