import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} />
        <main className="min-h-0 flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
