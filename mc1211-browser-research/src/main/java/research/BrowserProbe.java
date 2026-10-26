package research;

import org.teavm.jso.dom.html.HTMLDocument;

public final class BrowserProbe {
    public static void main(String[] args) {
        var document = HTMLDocument.current();
        var result = document.createElement("p");
        result.appendChild(document.createTextNode(
            "PASS: Java compiled to browser JavaScript and executed."
        ));
        document.getBody().appendChild(result);
    }
}
