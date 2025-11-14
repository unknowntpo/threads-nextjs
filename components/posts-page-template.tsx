import { NavSidebar } from '@/components/nav-sidebar';
import { Separator } from '@/components/ui/separator';

interface PostsPageTemplateProps {
  header?: React.ReactNode;
  beforePosts?: React.ReactNode;
  posts: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl';
}

export function PostsPageTemplate({
  header,
  beforePosts,
  posts,
  maxWidth = '2xl',
}: PostsPageTemplateProps) {
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

            {/* Before posts slot - CreatePostForm (conditional) */}
            {beforePosts && (
              <>
                {beforePosts}
                <Separator />
              </>
            )}

            {/* Posts slot - Feed or PostsList */}
            {posts}
          </div>
        </div>
      </div>
    </>
  );
}
