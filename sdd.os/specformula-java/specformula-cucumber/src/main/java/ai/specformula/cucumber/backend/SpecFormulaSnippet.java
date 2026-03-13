package ai.specformula.cucumber.backend;

import java.lang.reflect.Type;
import java.text.MessageFormat;
import java.util.Map;

import io.cucumber.core.backend.Snippet;

public class SpecFormulaSnippet implements Snippet {

    @Override
    public MessageFormat template() {
        return new MessageFormat(
            """
            @{0}("{1}")
            public void {2}({3}) '{'
                // {4}
            {5}    throw new io.cucumber.java.PendingException();
            '}'""");
    }

    @Override
    public String tableHint() {
        return """
                   // For automatic transformation, change DataTable to one of
                   // E, List<E>, List<List<E>>, List<Map<K,V>>, Map<K,V> or
                   // Map<K, List<V>>.
               """;
    }

    @Override
    public String arguments(Map<String, Type> arguments) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        for (Map.Entry<String, Type> entry : arguments.entrySet()) {
            if (i > 0) sb.append(", ");
            String typeName = ((Class<?>) entry.getValue()).getSimpleName();
            sb.append(typeName).append(" ").append(entry.getKey());
            i++;
        }
        return sb.toString();
    }

    @Override
    public String escapePattern(String pattern) {
        return pattern.replace("\"", "\\\"");
    }
}
