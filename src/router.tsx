// Attivazione future flags React Router v6 per rimuovere i warning:
// - v7_startTransition
// - v7_relativeSplatPath
//
// Scegli una delle due opzioni in base a come è strutturata l’app.

// OPZIONE A) Data Router (consigliata se usi loader/action/RouterProvider)
import * as React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  RouteObject,
} from 'react-router-dom';

// Definisci le tue routes reali qui:
const routes: RouteObject[] = [
  // ...existing routes...
];

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
  // ...eventuali altre opzioni (basename, hydrationData, ecc.)...
});

export function AppRouterData() {
  return (
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true }}
      // fallbackElement={...} // opzionale
    />
  );
}

// OPZIONE B) BrowserRouter semplice (se usi <Routes> senza data APIs)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function AppRouterSimple() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* ...existing routes... */}
        {/* <Route path="/" element={<Home />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

/*
In index.tsx/main.tsx usa UNO dei due:
  import { AppRouterData } from './router';
  // ReactDOM.createRoot(...).render(<AppRouterData />);

oppure:
  import { AppRouterSimple } from './router';
  // ReactDOM.createRoot(...).render(<AppRouterSimple />);
*/
