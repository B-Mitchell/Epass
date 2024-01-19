// middleware.js

import { NextRequest, NextResponse } from 'next/server';
import { store } from './app/globalRedux/store'

export function middleware(request) {
  // const userData = store.getState().user.user_email;

  console.log('hello world, i see you');

  // Continue to the next middleware or route handler
  return NextResponse.next();
}
// export const config = {
//   // The above middleware would only run for the "/" path
//   matcher: '/profile',
// }