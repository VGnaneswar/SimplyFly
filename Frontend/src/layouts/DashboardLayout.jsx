export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <section className="panel page-panel">
      <div className="section-heading">
        {subtitle ? <p className="eyebrow">{subtitle}</p> : null}
        {title ? <h2>{title}</h2> : null}
      </div>
      {children}
    </section>
  )
}