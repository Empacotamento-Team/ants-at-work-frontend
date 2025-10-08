import React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  topClass?: string;
  className?: string;
  sticky?: boolean;
};

export function PageHeader({
  title,
  description,
  actions,
  topClass = "top-11",
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        sticky && "sticky",
        topClass,
        "sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]: dark:supports-[backdrop-filter]:bg-gray-900/60 pt-11 pb-4 mb-6",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        {typeof title === "string" ? (
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        ) : (
          title
        )}
        {description && (
          typeof description === "string" ? (
            <p className="text-muted-foreground">{description}</p>
          ) : (
            description
          )
        )}
        {actions && <div className="mt-1">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
