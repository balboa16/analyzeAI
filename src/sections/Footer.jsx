export default function Footer() {
  return (
    <footer className="border-t border-stroke bg-white">
      <div className="container grid gap-6 py-10 pb-24 md:grid-cols-3 lg:pb-10">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">АнализAI</p>
          <p className="text-xs text-muted">
            Сервис расшифровки анализов с рекомендациями и планом питания.
          </p>
        </div>
        <div className="space-y-2 text-xs text-muted">
          <p>Контакты</p>
          <p>+996 990 10 88 88</p>
          <p>WhatsApp: +996 990 10 88 88</p>
          <p>г. Бишкек, Мкр. Джал-29, д.18</p>
        </div>
        <div className="space-y-2 text-xs text-muted">
          <p>Документы</p>
          <p>Политика конфиденциальности</p>
          <p>Условия использования</p>
          <p>Лицензии и сертификаты</p>
        </div>
      </div>
    </footer>
  );
}
