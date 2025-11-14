import { NavSidebar } from '@/components/nav-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

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
          <Card className="overflow-hidden">
            {/* Header slot - Feed tabs or Profile card */}
            {header}

            {/* Before content slot - CreatePostForm (conditional) */}
            {beforeContent && (
              <>
                <Separator />
                {beforeContent}
              </>
            )}

            {/* Separator before content */}
            {beforeContent && <Separator />}

            {/* Content slot - Feed or PostsList */}
            {content}
          </Card>
        </div>
      </div>
    </>
  );
}
