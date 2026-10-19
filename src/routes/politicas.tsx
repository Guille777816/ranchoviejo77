import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politicas")({
  head: () => ({
    meta: [
      {
        title: "Políticas de compra, cambios y reclamos — Rancho Viejo Mates",
      },
      {
        name: "description",
        content:
          "Condiciones de venta mayorista, cambios, devoluciones y reclamos de Rancho Viejo Mates.",
      },
      {
        property: "og:title",
        content: "Políticas de compra, cambios y reclamos — Rancho Viejo Mates",
      },
      {
        property: "og:description",
        content:
          "Condiciones de venta mayorista, cambios, devoluciones y reclamos de Rancho Viejo Mates.",
      },
      { property: "og:url", content: "https://ranchoviejo.com.ar/politicas" },
      { property: "og:image", content: "https://ranchoviejo.com.ar/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://ranchoviejo.com.ar/politicas" },
    ],
  }),
  component: PoliticasPage,
});

function PoliticasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Políticas de compra, cambios y reclamos
      </h1>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Rancho Viejo – Venta mayorista
      </p>

      <div className="mt-8 space-y-10 text-[15px] leading-relaxed">
        <section>
          <p>
            En Rancho Viejo trabajamos con productos elaborados artesanalmente
            y, en gran parte, con materiales naturales. Por esta razón, cada
            pieza es única y puede presentar pequeñas diferencias respecto de
            otra del mismo modelo.
          </p>
          <p className="mt-3">
            Al tratarse de una tienda mayorista destinada a comercios y
            revendedores, recomendamos leer estas condiciones antes de
            realizar una compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Productos artesanales y materiales naturales
          </h2>
          <p className="mt-3">
            Nuestros mates son elaborados y terminados artesanalmente.
            Trabajamos con materiales naturales como calabaza, madera de
            algarrobo y cuero vacuno, entre otros.
          </p>
          <p className="mt-3">
            Por su propia naturaleza, estos materiales pueden presentar
            variaciones de color, tono, veta, textura, forma, tamaño y
            terminación.
          </p>

          <h3 className="mt-6 text-lg font-semibold uppercase tracking-wide">
            Cuero vacuno
          </h3>
          <p className="mt-3">
            El cuero que utilizamos es cuero vacuno natural. Puede presentar
            pequeñas marcas, variaciones de tonalidad, textura, pliegues o
            características propias de la piel.
          </p>
          <p className="mt-3">
            Estas particularidades naturales no constituyen una falla del
            producto.
          </p>

          <h3 className="mt-6 text-lg font-semibold uppercase tracking-wide">
            Madera de algarrobo
          </h3>
          <p className="mt-3">
            Nuestros mates de madera son realizados en algarrobo de excelente
            calidad.
          </p>
          <p className="mt-3">
            Al tratarse de madera natural, cada pieza puede presentar
            diferentes vetas, tonalidades y nudos. Estas características forman
            parte de la madera y no se consideran defectos siempre que no
            comprometan la estructura ni la funcionalidad del mate.
          </p>
          <p className="mt-3">
            Un nudo, fisura u otra particularidad que atraviese la pieza y
            comprometa su integridad será evaluado como posible falla.
          </p>

          <h3 className="mt-6 text-lg font-semibold uppercase tracking-wide">
            Calabaza
          </h3>
          <p className="mt-3">
            La calabaza es un fruto natural y, por lo tanto, no existen dos
            unidades exactamente iguales.
          </p>
          <p className="mt-3">
            Puede haber diferencias de forma, tamaño, grosor, color, textura y
            otras características propias de cada calabaza. Estas variaciones
            naturales no constituyen defectos.
          </p>

          <h3 className="mt-6 text-lg font-semibold uppercase tracking-wide">
            Elaboración artesanal
          </h3>
          <p className="mt-3">
            Al ser productos realizados y terminados artesanalmente, pueden
            existir pequeñas diferencias de medidas, formas, tonos o
            terminaciones entre distintas unidades de un mismo modelo.
          </p>
          <p className="mt-3">
            Estas diferencias forman parte de la identidad de un producto
            artesanal y no se consideran fallas de fabricación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Fotografías y videos de los productos
          </h2>
          <p className="mt-3">
            Las fotografías publicadas en nuestra página tienen como finalidad
            mostrar nuestros productos de la mejor manera posible.
          </p>
          <p className="mt-3">
            Los colores o la apariencia pueden presentar pequeñas diferencias
            debido a la iluminación, la pantalla desde la cual se visualicen
            las imágenes, la ambientación o la edición utilizada para mejorar
            su presentación.
          </p>
          <p className="mt-3">
            Además, al trabajar con productos artesanales y materiales
            naturales, la unidad recibida puede no ser idéntica a la
            fotografiada.
          </p>
          <p className="mt-3">
            Para que nuestros clientes mayoristas puedan conocer mejor la
            mercadería antes de realizar su compra, contamos en nuestra página
            con una sección de videos donde pueden apreciarse los productos de
            una manera más directa y real.
          </p>
          <p className="mt-3">
            También pueden contactarnos antes de abonar para solicitar
            asesoramiento, fotografías adicionales, medidas o cualquier
            información que necesiten.
          </p>
          <p className="mt-3 font-medium">
            Recomendamos despejar todas las dudas antes de confirmar la
            compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Diferencias estéticas o de gusto
          </h2>
          <p className="mt-3">
            No realizamos cambios o devoluciones únicamente por cuestiones de
            gusto o apreciación estética cuando el producto se encuentra en
            buenas condiciones y corresponde a lo solicitado.
          </p>
          <p className="mt-3">
            Las pequeñas variaciones propias del cuero, la madera, la calabaza
            y de la elaboración artesanal —como diferencias de tono, veta,
            textura, forma o terminación— no constituyen por sí mismas una
            falla.
          </p>
          <p className="mt-3">
            Por este motivo ponemos a disposición fotografías, videos y
            asesoramiento previo para que cada cliente mayorista pueda conocer
            las características de la mercadería antes de realizar su compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Recepción y control del pedido
          </h2>
          <p className="mt-3">
            Al recibir la mercadería, es responsabilidad del comprador
            mayorista controlar cuidadosamente el pedido antes de poner los
            productos a la venta o entregarlos a sus clientes.
          </p>
          <p className="mt-3">
            Solicitamos realizar este control al momento de recibir la
            mercadería y comunicar cualquier rotura, daño visible, faltante o
            inconveniente atribuible al transporte dentro de las 24 horas de
            recibido el pedido.
          </p>
          <p className="mt-3">
            Para realizar el reclamo será necesario enviar fotografías y/o
            videos claros del producto y, cuando corresponda, conservar y
            fotografiar también el embalaje en el que fue recibido.
          </p>
          <p className="mt-3">
            Entre los daños o fallas visibles que deben informarse se
            encuentran, por ejemplo:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-6">
            <li>cuero cortado o dañado;</li>
            <li>virola despegada;</li>
            <li>virola abollada o dañada durante el transporte;</li>
            <li>calabaza quebrada;</li>
            <li>golpes o roturas producidos durante el envío;</li>
            <li>faltantes en el pedido;</li>
            <li>
              defectos visibles que comprometan la estructura o funcionalidad
              del producto.
            </li>
          </ul>
          <p className="mt-3">
            Una vez recibido el reclamo, Rancho Viejo evaluará el caso y
            determinará la solución correspondiente según el tipo de
            inconveniente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Importante para nuestros revendedores
          </h2>
          <p className="mt-3">
            Rancho Viejo realiza ventas mayoristas a comercios y revendedores.
          </p>
          <p className="mt-3">
            Por este motivo, corresponde al comprador mayorista revisar el
            estado de cada producto al recibir el pedido y antes de
            comercializarlo o entregarlo a su consumidor final.
          </p>
          <p className="mt-3">
            Una vez que el producto haya sido vendido por el comercio y
            posteriormente curado, utilizado, lavado o manipulado por el
            consumidor final, Rancho Viejo no aceptará reclamos relacionados
            con el proceso de curado, uso, lavado, conservación, golpes,
            humedad, almacenamiento o manipulación posterior, ya que dichas
            circunstancias se encuentran fuera de nuestro control.
          </p>
          <p className="mt-3">
            Recomendamos a nuestros clientes brindar al consumidor final las
            instrucciones correspondientes para el correcto curado,
            utilización y conservación del mate.
          </p>
          <p className="mt-3">
            Lo anterior no alcanza a aquellos defectos de fabricación no
            visibles al momento de la recepción respecto de los cuales pudiera
            corresponder responsabilidad conforme a la normativa aplicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Productos personalizados
          </h2>
          <p className="mt-3">
            Los productos realizados especialmente a pedido —por ejemplo,
            mates grabados con nombres, marcas, logos, frases o diseños
            solicitados por el comprador— no admiten cambios por cuestiones de
            gusto, diseño o arrepentimiento una vez realizada correctamente la
            personalización solicitada.
          </p>
          <p className="mt-3">
            Si el producto personalizado presentara una falla de fabricación o
            no correspondiera a lo solicitado en el pedido, el caso será
            evaluado por Rancho Viejo.
          </p>
          <p className="mt-3">
            Por este motivo recomendamos revisar cuidadosamente nombres,
            textos, logos, diseños y demás información enviada para
            personalizar un producto antes de confirmar su producción.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Daños producidos por el uso
          </h2>
          <p className="mt-3">
            No se consideran defectos de fabricación los daños producidos
            posteriormente por:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-6">
            <li>golpes o caídas;</li>
            <li>humedad;</li>
            <li>curado incorrecto;</li>
            <li>lavado inadecuado;</li>
            <li>exposición excesiva al agua o al calor;</li>
            <li>almacenamiento incorrecto;</li>
            <li>utilización de productos químicos o abrasivos;</li>
            <li>falta de mantenimiento;</li>
            <li>manipulación o utilización inadecuada del producto.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Nuestro compromiso
          </h2>
          <p className="mt-3">
            En Rancho Viejo queremos construir relaciones comerciales
            duraderas con nuestros clientes.
          </p>
          <p className="mt-3">
            Por eso buscamos brindar información clara sobre nuestros
            productos y estamos disponibles antes de cada compra para
            responder consultas, enviar fotografías adicionales y asesorar
            sobre modelos, materiales y características.
          </p>
          <p className="mt-3">
            Trabajamos con productos artesanales y materiales naturales, por
            lo que cada pieza puede tener características que la hacen única.
          </p>
          <p className="mt-3">
            Ante cualquier inconveniente con un pedido, comunicate con
            nosotros lo antes posible para que podamos evaluar el caso y
            brindarte una respuesta.
          </p>
        </section>
      </div>
    </div>
  );
}
