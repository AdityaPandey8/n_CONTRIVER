import { motion } from "framer-motion";
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIAssistantCardProps {
  delay?: number;
}

export function AIAssistantCard({ delay = 0 }: AIAssistantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5 border-primary/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-lg">AI Startup Mentor</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Need guidance? Ask anything about your startup journey – from ideation to scaling.
                </p>
              </div>
              <Button className="gradient-accent text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all group">
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Conversation
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
