import { NavSidebar } from '@/components/nav-sidebar';
import { Separator } from '@/components/ui/separator';

interface ViewTemplateProps {
  header?: React.ReactNode;
  beforeContent?: React.ReactNode;
  content: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl';
}

export function ViewTemplate({
  header,
  beforeContent,
  content,
  maxWidth = '2xl',
}: ViewTemplateProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <>
      <NavSidebar />
      <div className="flex w-full flex-1 flex-col items-center pl-20">
        <div className={`w-full ${maxWidthClass} p-6`}>
          <div className="space-y-8">
            {/* Header slot - Feed tabs or Profile card */}
            {header && <div>{header}</div>}

            {/* Before content slot - CreatePostForm (conditional) */}
            {beforeContent && (
              <>
                {beforeContent}
                <Separator />
              </>
            )}

            {/* Content slot - Feed or PostsList */}
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
