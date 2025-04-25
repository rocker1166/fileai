import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Sun, Moon, Laptop, Github } from "lucide-react"

export default function ThemeSettings({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setTheme, theme } = useTheme()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] bg-background">
        <SheetHeader className="py-4">
          <SheetTitle className="text-lg font-bold">Settings & Info</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTheme('light')}
                className="w-full justify-start"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTheme('dark')}
                className="w-full justify-start"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTheme('system')}
                className="w-full justify-start"
              >
                <Laptop className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-4">About</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                FileAI is an intelligent document analysis and chat interface that helps you interact with your documents using AI.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License</span>
                  <span>MIT</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-4">Links</h3>
            <div className="grid gap-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com/rocker1166/fileai" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Repository
                </a>
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FileAI. All rights reserved.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}