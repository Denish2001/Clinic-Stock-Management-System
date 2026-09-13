// purpose is to enforce consistent layout, styling, and structural
// organization across your pages while using the special children prop
// to wrap whatever dynamic content you pass into it.

export function MainContent({ children }) {
  return <main className="main-content">{children}</main>;
}
