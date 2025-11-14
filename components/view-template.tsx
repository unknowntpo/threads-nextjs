import { NavSidebar } from '@/components/nav-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

interface ViewTemplateProps {
  header?: React.ReactNode;
  beforeContent?: React.ReactNode;
  content: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl';
  centerContent?: boolean;
}

export function ViewTemplate({
  header,
  beforeContent,
  content,
  maxWidth = '2xl',
  centerContent = false,
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
      <div className="flex min-h-screen w-full flex-1 flex-col items-center bg-secondary pl-20">
        <div className={`w-full ${maxWidthClass} ${centerContent ? '-ml-10' : ''} p-6`}>
          {/* Header slot - Feed tabs (outside Card) */}
          {header}

          <Card className="overflow-hidden">
            {/* Before content slot - CreatePostForm (conditional) */}
            {beforeContent}

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
