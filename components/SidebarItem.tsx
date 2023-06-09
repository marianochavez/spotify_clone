import Link from "next/link";
import { IconType } from "react-icons";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: IconType;
  label: string;
  href: string;
  active?: boolean;
};

const SidebarItem = ({ icon: Icon, href, label, active }: SidebarItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-auto items-center w-full space-x-4 text-md font-medium cursor-pointer hover:text-white transition text-neutral-400 py-1",
        active && "text-white"
      )}
    >
      <Icon size={26} />
      <p className="truncate w-full">{label}</p>
    </Link>
  );
};

export default SidebarItem;
