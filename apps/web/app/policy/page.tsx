import Link from "next/link";
import Header from "@/components/Header/Header";
import { BreadCrumbWithDropdown } from "@/components/shared/Breadcrumb";

export default function Page() {
	return (
		<>
			<Header />
			<main className="flex flex-col p-8 mt-16 gap-8 sm:p-16 sm:mt-8">
				<BreadCrumbWithDropdown />
				<div className="flex flex-col gap-4">
					<div className="font-bold text-4xl">Impressum</div>
					<p>
						Sebastian Krüll
						<br />
						Rosenbergstr. 14
						<br />
						74072 Heilbronn
						<br />
						Deutschland
						<br />
						<Link href="mailto:mail@simradar21.com">mail@simradar21.com</Link>
					</p>
				</div>
				<div className="flex flex-col gap-4">
					<div className="font-bold text-4xl">Datenschutz&shy;erkl&auml;rung</div>
					<div className="font-bold text-2xl">
						<span className="text-green">1.</span> Datenschutz auf einen Blick
					</div>
					<div className="font-semibold text-xl">Allgemeine Hinweise</div>{" "}
					<p>
						Die folgenden Hinweise geben einen einfachen &Uuml;berblick dar&uuml;ber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
						Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen.
						Ausf&uuml;hrliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgef&uuml;hrten Datenschutzerkl&auml;rung.
					</p>
					<div className="font-semibold text-xl">Datenerfassung auf dieser Website</div>
					<div className="font-semibold">Wer ist verantwortlich f&uuml;r die Datenerfassung auf dieser Website?</div>{" "}
					<p>
						Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten k&ouml;nnen Sie dem Abschnitt
						&bdquo;Hinweis zur Verantwortlichen Stelle&ldquo; in dieser Datenschutzerkl&auml;rung entnehmen.
					</p>{" "}
					<div className="font-semibold">Wie erfassen wir Ihre Daten?</div>{" "}
					<p>
						Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie in
						ein Kontaktformular eingeben.
					</p>{" "}
					<p>
						Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem
						technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt
						automatisch, sobald Sie diese Website betreten.
					</p>{" "}
					<div className="font-semibold">Wof&uuml;r nutzen wir Ihre Daten?</div>{" "}
					<p>
						Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gew&auml;hrleisten. Andere Daten k&ouml;nnen zur
						Analyse Ihres Nutzerverhaltens verwendet werden. Sofern &uuml;ber die Website Vertr&auml;ge geschlossen oder angebahnt werden k&ouml;nnen,
						werden die &uuml;bermittelten Daten auch f&uuml;r Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.
					</p>{" "}
					<div className="font-semibold">Welche Rechte haben Sie bez&uuml;glich Ihrer Daten?</div>{" "}
					<p>
						Sie haben jederzeit das Recht, unentgeltlich Auskunft &uuml;ber Herkunft, Empf&auml;nger und Zweck Ihrer gespeicherten personenbezogenen
						Daten zu erhalten. Sie haben au&szlig;erdem ein Recht, die Berichtigung oder L&ouml;schung dieser Daten zu verlangen. Wenn Sie eine
						Einwilligung zur Datenverarbeitung erteilt haben, k&ouml;nnen Sie diese Einwilligung jederzeit f&uuml;r die Zukunft widerrufen.
						Au&szlig;erdem haben Sie das Recht, unter bestimmten Umst&auml;nden die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten
						zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde zu.
					</p>{" "}
					<p>Hierzu sowie zu weiteren Fragen zum Thema Datenschutz k&ouml;nnen Sie sich jederzeit an uns wenden.</p>
					<div className="font-semibold text-xl">
						<span className="text-green">2.</span> Hosting
					</div>
					<p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
					<div className="font-semibold text-xl">Strato</div>{" "}
					<p>
						Anbieter ist die Strato AG, Otto-Ostrowski-Stra&szlig;e 7, 10249 Berlin (nachfolgend &bdquo;Strato&ldquo;). Wenn Sie unsere Website
						besuchen, erfasst Strato verschiedene Logfiles inklusive Ihrer IP-Adressen.
					</p>{" "}
					<p>
						Weitere Informationen entnehmen Sie der Datenschutzerkl&auml;rung von Strato:{" "}
						<Link href="https://www.strato.de/datenschutz/" target="_blank" rel="noopener noreferrer">
							Strato Datenschutz
						</Link>
						.
					</p>{" "}
					<p>
						Die Verwendung von Strato erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer
						m&ouml;glichst zuverl&auml;ssigen Darstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die
						Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die
						Speicherung von Cookies oder den Zugriff auf Informationen im Endger&auml;t des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des
						TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
					</p>
					<div className="font-semibold">Auftragsverarbeitung</div>{" "}
					<p>
						Wir haben einen Vertrag &uuml;ber Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich
						um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gew&auml;hrleistet, dass dieser die personenbezogenen Daten unserer
						Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.
					</p>
					<div className="font-bold text-2xl">
						<span className="text-green">3.</span> Allgemeine Hinweise und Pflicht&shy;informationen
					</div>
					<div className="font-semibold text-xl">Datenschutz</div>{" "}
					<p>
						Die Betreiber dieser Seiten nehmen den Schutz Ihrer pers&ouml;nlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
						vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerkl&auml;rung.
					</p>{" "}
					<p>
						Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie
						pers&ouml;nlich identifiziert werden k&ouml;nnen. Die vorliegende Datenschutzerkl&auml;rung erl&auml;utert, welche Daten wir erheben und
						wof&uuml;r wir sie nutzen. Sie erl&auml;utert auch, wie und zu welchem Zweck das geschieht.
					</p>{" "}
					<p>
						Wir weisen darauf hin, dass die Daten&uuml;bertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitsl&uuml;cken
						aufweisen kann. Ein l&uuml;ckenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht m&ouml;glich.
					</p>
					<div className="font-semibold text-xl">Hinweis zur verantwortlichen Stelle</div>{" "}
					<p>Die verantwortliche Stelle f&uuml;r die Datenverarbeitung auf dieser Website ist:</p>{" "}
					<p>Sebastian Kr&uuml;ll, Rosenbergstr. 14, 74072 Heilbronn, Deutschland / Germany</p>
					<p>
						E-Mail: <Link href="mailto:mail@simradar21.com">mail@simradar21.com</Link>
					</p>
					<p>
						Verantwortliche Stelle ist die nat&uuml;rliche oder juristische Person, die allein oder gemeinsam mit anderen &uuml;ber die Zwecke und
						Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o. &Auml;.) entscheidet.
					</p>
					<div className="font-semibold text-xl">Speicherdauer</div>{" "}
					<p>
						Soweit innerhalb dieser Datenschutzerkl&auml;rung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten
						bei uns, bis der Zweck f&uuml;r die Datenverarbeitung entf&auml;llt. Wenn Sie ein berechtigtes L&ouml;schersuchen geltend machen oder eine
						Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gel&ouml;scht, sofern wir keine anderen rechtlich zul&auml;ssigen
						Gr&uuml;nde f&uuml;r die Speicherung Ihrer personenbezogenen Daten haben (z.&nbsp;B. steuer- oder handelsrechtliche Aufbewahrungsfristen);
						im letztgenannten Fall erfolgt die L&ouml;schung nach Fortfall dieser Gr&uuml;nde.
					</p>
					<div className="font-semibold text-xl">Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</div>{" "}
					<p>
						Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit.
						a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer
						ausdr&uuml;cklichen Einwilligung in die &Uuml;bertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung
						au&szlig;erdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf
						Informationen in Ihr Endger&auml;t (z.&nbsp;B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung
						zus&auml;tzlich auf Grundlage von &sect; 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur
						Vertragserf&uuml;llung oder zur Durchf&uuml;hrung vorvertraglicher Ma&szlig;nahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage
						des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erf&uuml;llung einer rechtlichen Verpflichtung
						erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
						Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. &Uuml;ber die jeweils im Einzelfall einschl&auml;gigen Rechtsgrundlagen wird in den
						folgenden Abs&auml;tzen dieser Datenschutzerkl&auml;rung informiert.
					</p>
					<div className="font-semibold text-xl">Empf&auml;nger von personenbezogenen Daten</div>{" "}
					<p>
						Im Rahmen unserer Gesch&auml;ftst&auml;tigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine
						&Uuml;bermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe
						Stellen weiter, wenn dies im Rahmen einer Vertragserf&uuml;llung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind
						(z.&nbsp;B. Weitergabe von Daten an Steuerbeh&ouml;rden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der
						Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir
						personenbezogene Daten unserer Kunden nur auf Grundlage eines g&uuml;ltigen Vertrags &uuml;ber Auftragsverarbeitung weiter. Im Falle einer
						gemeinsamen Verarbeitung wird ein Vertrag &uuml;ber gemeinsame Verarbeitung geschlossen.
					</p>
					<div className="font-semibold text-xl">Widerruf Ihrer Einwilligung zur Datenverarbeitung</div>{" "}
					<p>
						Viele Datenverarbeitungsvorg&auml;nge sind nur mit Ihrer ausdr&uuml;cklichen Einwilligung m&ouml;glich. Sie k&ouml;nnen eine bereits
						erteilte Einwilligung jederzeit widerrufen. Die Rechtm&auml;&szlig;igkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom
						Widerruf unber&uuml;hrt.
					</p>
					<div className="font-semibold text-xl">
						Widerspruchsrecht gegen die Datenerhebung in besonderen F&auml;llen sowie gegen Direktwerbung (Art. 21 DSGVO)
					</div>{" "}
					<p>
						WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GR&Uuml;NDEN,
						DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT
						AUCH F&Uuml;R EIN AUF DIESE BESTIMMUNGEN GEST&Uuml;TZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT,
						ENTNEHMEN SIE DIESER DATENSCHUTZERKL&Auml;RUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT
						MEHR VERARBEITEN, ES SEI DENN, WIR K&Ouml;NNEN ZWINGENDE SCHUTZW&Uuml;RDIGE GR&Uuml;NDE F&Uuml;R DIE VERARBEITUNG NACHWEISEN, DIE IHRE
						INTERESSEN, RECHTE UND FREIHEITEN &Uuml;BERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUS&Uuml;BUNG ODER VERTEIDIGUNG VON
						RECHTSANSPR&Uuml;CHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).
					</p>{" "}
					<p>
						WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE
						VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH F&Uuml;R DAS PROFILING,
						SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT
						MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).
					</p>
					<div className="font-semibold text-xl">Beschwerde&shy;recht bei der zust&auml;ndigen Aufsichts&shy;beh&ouml;rde</div>{" "}
					<p>
						Im Falle von Verst&ouml;&szlig;en gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbeh&ouml;rde, insbesondere
						in dem Mitgliedstaat ihres gew&ouml;hnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutma&szlig;lichen Versto&szlig;es zu.
						Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
					</p>
					<div className="font-semibold text-xl">Recht auf Daten&shy;&uuml;bertrag&shy;barkeit</div>{" "}
					<p>
						Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erf&uuml;llung eines Vertrags automatisiert verarbeiten, an
						sich oder an einen Dritten in einem g&auml;ngigen, maschinenlesbaren Format aush&auml;ndigen zu lassen. Sofern Sie die direkte
						&Uuml;bertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
					</p>
					<div className="font-semibold text-xl">Auskunft, Berichtigung und L&ouml;schung</div>{" "}
					<p>
						Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft &uuml;ber Ihre gespeicherten
						personenbezogenen Daten, deren Herkunft und Empf&auml;nger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder
						L&ouml;schung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten k&ouml;nnen Sie sich jederzeit an uns wenden.
					</p>
					<div className="font-semibold text-xl">Recht auf Einschr&auml;nkung der Verarbeitung</div>{" "}
					<p>
						Sie haben das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu k&ouml;nnen Sie sich
						jederzeit an uns wenden. Das Recht auf Einschr&auml;nkung der Verarbeitung besteht in folgenden F&auml;llen:
					</p>{" "}
					<ul>
						{" "}
						<li>
							Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, ben&ouml;tigen wir in der Regel Zeit, um dies
							zu &uuml;berpr&uuml;fen. F&uuml;r die Dauer der Pr&uuml;fung haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer
							personenbezogenen Daten zu verlangen.
						</li>{" "}
						<li>
							Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtm&auml;&szlig;ig geschah/geschieht, k&ouml;nnen Sie statt der L&ouml;schung
							die Einschr&auml;nkung der Datenverarbeitung verlangen.
						</li>{" "}
						<li>
							Wenn wir Ihre personenbezogenen Daten nicht mehr ben&ouml;tigen, Sie sie jedoch zur Aus&uuml;bung, Verteidigung oder Geltendmachung von
							Rechtsanspr&uuml;chen ben&ouml;tigen, haben Sie das Recht, statt der L&ouml;schung die Einschr&auml;nkung der Verarbeitung Ihrer
							personenbezogenen Daten zu verlangen.
						</li>{" "}
						<li>
							Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abw&auml;gung zwischen Ihren und unseren Interessen
							vorgenommen werden. Solange noch nicht feststeht, wessen Interessen &uuml;berwiegen, haben Sie das Recht, die Einschr&auml;nkung der
							Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
						</li>{" "}
					</ul>{" "}
					<p>
						Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschr&auml;nkt haben, d&uuml;rfen diese Daten &ndash; von ihrer Speicherung
						abgesehen &ndash; nur mit Ihrer Einwilligung oder zur Geltendmachung, Aus&uuml;bung oder Verteidigung von Rechtsanspr&uuml;chen oder zum
						Schutz der Rechte einer anderen nat&uuml;rlichen oder juristischen Person oder aus Gr&uuml;nden eines wichtigen &ouml;ffentlichen
						Interesses der Europ&auml;ischen Union oder eines Mitgliedstaats verarbeitet werden.
					</p>
					<div className="font-semibold text-xl">SSL- bzw. TLS-Verschl&uuml;sselung</div>{" "}
					<p>
						Diese Seite nutzt aus Sicherheitsgr&uuml;nden und zum Schutz der &Uuml;bertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen
						oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschl&uuml;sselung. Eine verschl&uuml;sselte Verbindung
						erkennen Sie daran, dass die Adresszeile des Browsers von &bdquo;http://&ldquo; auf &bdquo;https://&ldquo; wechselt und an dem
						Schloss-Symbol in Ihrer Browserzeile.
					</p>{" "}
					<p>
						Wenn die SSL- bzw. TLS-Verschl&uuml;sselung aktiviert ist, k&ouml;nnen die Daten, die Sie an uns &uuml;bermitteln, nicht von Dritten
						mitgelesen werden.
					</p>
					<div className="font-semibold text-2xl">
						<span className="text-green">4.</span> Datenerfassung auf dieser Website
					</div>
					<div className="font-semibold text-xl">Server-Log-Dateien</div>{" "}
					<p>
						Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an
						uns &uuml;bermittelt. Dies sind:
					</p>{" "}
					<ul>
						{" "}
						<li>Browsertyp und Browserversion</li> <li>verwendetes Betriebssystem</li> <li>Referrer URL</li>{" "}
						<li>Hostname des zugreifenden Rechners</li> <li>Uhrzeit der Serveranfrage</li> <li>IP-Adresse</li>{" "}
					</ul>{" "}
					<p>Eine Zusammenf&uuml;hrung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p>{" "}
					<p>
						Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an
						der technisch fehlerfreien Darstellung und der Optimierung seiner Website &ndash; hierzu m&uuml;ssen die Server-Log-Files erfasst werden.
					</p>
					<div className="font-semibold text-2xl">
						<span className="text-green">5.</span> Plugins und Tools
					</div>
					<div className="font-semibold text-xl">Google Fonts</div>{" "}
					<p>
						Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die von Google bereitgestellt werden. Beim
						Aufruf einer Seite l&auml;dt Ihr Browser die ben&ouml;tigten Fonts in ihren Browsercache, um Texte und Schriftarten korrekt anzuzeigen.
					</p>{" "}
					<p>
						Zu diesem Zweck muss der von Ihnen verwendete Browser Verbindung zu den Servern von Google aufnehmen. Hierdurch erlangt Google Kenntnis
						dar&uuml;ber, dass &uuml;ber Ihre IP-Adresse diese Website aufgerufen wurde. Die Nutzung von Google Fonts erfolgt auf Grundlage von Art. 6
						Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der einheitlichen Darstellung des Schriftbildes auf seiner
						Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6
						Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im
						Endger&auml;t des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
					</p>{" "}
					<p>Wenn Ihr Browser Google Fonts nicht unterst&uuml;tzt, wird eine Standardschrift von Ihrem Computer genutzt.</p>{" "}
					<p>
						Weitere Informationen zu Google Fonts finden Sie unter{" "}
						<Link href="https://developers.google.com/fonts/faq" target="_blank" rel="noopener noreferrer">
							Google Fonts FAQ
						</Link>{" "}
						und in der Datenschutzerkl&auml;rung von Google:{" "}
						<Link href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer">
							Google Datenschutzerklärung
						</Link>
						.
					</p>
					<p>
						Das Unternehmen verf&uuml;gt &uuml;ber eine Zertifizierung nach dem &bdquo;EU-US Data Privacy Framework&ldquo; (DPF). Der DPF ist ein
						&Uuml;bereinkommen zwischen der Europ&auml;ischen Union und den USA, der die Einhaltung europ&auml;ischer Datenschutzstandards bei
						Datenverarbeitungen in den USA gew&auml;hrleisten soll. Jedes nach dem DPF zertifizierte Unternehmen verpflichtet sich, diese
						Datenschutzstandards einzuhalten. Weitere Informationen hierzu erhalten Sie vom Anbieter unter folgendem Link:{" "}
						<Link href="https://www.dataprivacyframework.gov/participant/5780" target="_blank" rel="noopener noreferrer">
							Data Privacy Framework
						</Link>
						.
					</p>
					<div className="font-semibold text-xl">OpenStreetMap</div> <p>Wir nutzen den Kartendienst von OpenStreetMap (OSM).</p>{" "}
					<p>
						Wir binden das Kartenmaterial von OpenStreetMap auf dem Server der OpenStreetMap Foundation, St John&rsquo;s Innovation Centre, Cowley
						Road, Cambridge, CB4 0WS, Gro&szlig;britannien, ein. Gro&szlig;britannien gilt als datenschutzrechtlich sicherer Drittstaat. Das bedeutet,
						dass Gro&szlig;britannien ein Datenschutzniveau aufweist, das dem Datenschutzniveau in der Europ&auml;ischen Union entspricht. Bei der
						Nutzung der OpenStreetMap-Karten wird eine Verbindung zu den Servern der OpenStreetMap-Foundation hergestellt. Dabei k&ouml;nnen
						u.&nbsp;a. Ihre IP-Adresse und weitere Informationen &uuml;ber Ihr Verhalten auf dieser Website an die OSMF weitergeleitet werden.
						OpenStreetMap speichert hierzu unter Umst&auml;nden Cookies in Ihrem Browser oder setzt vergleichbare Wiedererkennungstechnologien ein.
					</p>
					<p>
						Die Nutzung von OpenStreetMap erfolgt im Interesse einer ansprechenden Darstellung unserer Online-Angebote und einer leichten
						Auffindbarkeit der von uns auf der Website angegebenen Orte. Dies stellt ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f
						DSGVO dar. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6
						Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im
						Endger&auml;t des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
					</p>
					<div className="font-semibold text-xl">VATSIM</div>
					<p>
						Wir nutzen VATSIM International für die Authentifizierung und Benutzerverwaltung. Dies ermöglicht Ihnen, sich mit Ihrem VATSIM-Konto
						anzumelden.
					</p>
					<p>
						Beim Login über VATSIM erhalten wir ausschließlich Ihre VATSIM-Benutzer-ID (CID). Diese nutzen wir, um Ihr Benutzerkonto eindeutig zu
						identifizieren und Ihre Einstellungen auf unserem Server unter Ihrem VATSIM-Benutzer zu speichern. Weitere personenbezogene Daten von
						VATSIM werden von uns nicht verarbeitet.
					</p>
					<p>
						Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO aufgrund Ihrer Einwilligung zur Anmeldung über VATSIM. Sie können
						diese Einwilligung jederzeit durch eine schriftliche Mitteilung an <Link href="mailto:mail@simradar21.com">mail@simradar21.com</Link>{" "}
						widerrufen.
					</p>
					<p>
						VATSIM verfügt über geeignete Datenschutzmaßnahmen und bietet ein angemessenes Datenschutzniveau. Weitere Informationen finden Sie in der{" "}
						<Link href="https://vatsim.net/docs/policy/overview" target="_blank" rel="noopener noreferrer">
							Datenschutzerklärung von VATSIM
						</Link>
						.
					</p>
					<div className="font-semibold text-xl">Cloudflare</div>
					<p>
						Wir nutzen Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA, als Content Delivery Network (CDN) und f&uuml;r
						Objektspeicherung (Cloudflare R2).
					</p>
					<p>
						Cloudflare speichert und verarbeitet Daten, einschlie&szlig;lich Ihrer IP-Adresse, Browserinformationen und Zugriffsdaten, um unsere
						Website schneller bereitzustellen und vor Bedrohungen zu sch&uuml;tzen. Beim Zugriff auf unsere Website oder auf &uuml;ber Cloudflare
						gespeicherte Inhalte werden diese Daten verarbeitet.
					</p>
					<p>
						Die Nutzung von Cloudflare erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer
						m&ouml;glichst schnellen und sicheren Bereitstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die
						Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die
						Speicherung von Cookies oder den Zugriff auf Informationen im Endger&auml;t des Nutzers im Sinne des TDDDG umfasst. Die Einwilligung ist
						jederzeit widerrufbar.
					</p>
					<p>
						Cloudflare verf&uuml;gt &uuml;ber eine Zertifizierung nach dem &bdquo;EU-US Data Privacy Framework&ldquo; (DPF) und bietet somit ein
						angemessenes Datenschutzniveau. Weitere Informationen finden Sie in der{" "}
						<Link href="https://www.cloudflare.com/de-de/privacypolicy/" target="_blank" rel="noopener noreferrer">
							Datenschutzerkl&auml;rung von Cloudflare
						</Link>
						.
					</p>
				</div>
			</main>
		</>
	);
}
