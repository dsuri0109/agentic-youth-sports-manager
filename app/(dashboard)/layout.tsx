import IconSidebar from "@/app/components/IconSidebar";
import ChatPanel from "@/app/components/ChatPanel";
import { MorphicBarProvider } from "@/app/context/MorphicBarContext";
import { ChatProvider } from "@/app/context/ChatContext";
import { TeamProvider } from "@/app/context/TeamContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MorphicBarProvider>
      <TeamProvider>
        <ChatProvider>
          <div className="flex h-screen w-full overflow-hidden bg-[#F5F5F0]">
            <IconSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top: contextual UI */}
              <main className="flex-1 min-h-0 overflow-y-auto">
                {children}
              </main>
              {/* Bottom: AI chat panel */}
              <ChatPanel />
            </div>
          </div>
        </ChatProvider>
      </TeamProvider>
    </MorphicBarProvider>
  );
}
