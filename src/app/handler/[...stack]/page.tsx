import { StackHandler } from '@stackframe/stack';
import { getStackServerApp } from '@/lib/stack';

export default function Handler(props: { params: any, searchParams: any }) {
  return (
    <StackHandler
      app={getStackServerApp()}
      routeProps={props}
      fullPage={true}
    />
  );
}