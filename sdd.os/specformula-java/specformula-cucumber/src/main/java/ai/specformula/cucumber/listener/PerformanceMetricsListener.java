package ai.specformula.cucumber.listener;

import io.cucumber.plugin.ConcurrentEventListener;
import io.cucumber.plugin.event.EventPublisher;
import io.cucumber.plugin.event.PickleStepTestStep;
import io.cucumber.plugin.event.TestRunFinished;
import io.cucumber.plugin.event.TestStepFinished;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Cucumber event listener：統計 step definition 與 backend phase 的執行效能。
 * <p>
 * 在 {@code TestRunFinished} 時將報告寫入 {@code target/specformula-metrics.log}。
 * </p>
 * <p>
 * 註冊方式（cucumber.properties）：
 * <pre>
 * cucumber.plugin=ai.specformula.cucumber.listener.PerformanceMetricsListener
 * </pre>
 * </p>
 */
public class PerformanceMetricsListener implements ConcurrentEventListener {

    private static final System.Logger LOG =
            System.getLogger(PerformanceMetricsListener.class.getName());

    @Override
    public void setEventPublisher(EventPublisher publisher) {
        publisher.registerHandlerFor(TestStepFinished.class, this::handleTestStepFinished);
        publisher.registerHandlerFor(TestRunFinished.class, this::handleTestRunFinished);
    }

    private void handleTestStepFinished(TestStepFinished event) {
        if (!(event.getTestStep() instanceof PickleStepTestStep pickleStep)) {
            return;
        }
        String codeLocation = pickleStep.getCodeLocation();
        long durationNanos = event.getResult().getDuration().toNanos();
        PerformanceMetrics.getInstance().recordStep(codeLocation, durationNanos);
    }

    private void handleTestRunFinished(TestRunFinished event) {
        PerformanceMetrics metrics = PerformanceMetrics.getInstance();
        String report = buildReport(metrics);

        Path logFile = Path.of("target", "specformula-metrics.log");
        try {
            Files.createDirectories(logFile.getParent());
            Files.writeString(logFile, report, StandardCharsets.UTF_8);
            LOG.log(System.Logger.Level.INFO,
                    "SpecFormula metrics written to {0}", logFile.toAbsolutePath());
        } catch (IOException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "Failed to write metrics log: {0}", e.getMessage());
        }
    }

    private static String buildReport(PerformanceMetrics metrics) {
        StringBuilder sb = new StringBuilder();
        String separator = "=".repeat(90);

        sb.append(separator).append('\n');
        sb.append("  SpecFormula Performance Summary\n");
        sb.append(separator).append('\n');

        // Backend Phase Metrics
        Map<String, PerformanceMetrics.TimingAccumulator> phases = metrics.getPhaseMetrics();
        if (!phases.isEmpty()) {
            sb.append('\n');
            sb.append("  Backend Phases:\n");
            sb.append(String.format("  %-25s %8s %14s %14s%n",
                    "Phase", "Count", "Total (ms)", "Avg (ms)"));
            sb.append("  ").append("-".repeat(61)).append('\n');

            for (String phaseName : List.of("loadGlue", "buildWorld", "disposeWorld")) {
                var acc = phases.get(phaseName);
                if (acc != null) {
                    sb.append(String.format("  %-25s %8d %14.1f %14.1f%n",
                            phaseName, acc.getCount(),
                            acc.getTotalMillis(), acc.getAverageMillis()));
                }
            }
        }

        // Step Definition Metrics
        Map<String, PerformanceMetrics.TimingAccumulator> steps = metrics.getStepMetrics();
        if (!steps.isEmpty()) {
            sb.append('\n');
            sb.append("  Step Definitions:\n");
            sb.append(String.format("  %-50s %8s %14s %14s%n",
                    "Step Definition", "Count", "Total (ms)", "Avg (ms)"));
            sb.append("  ").append("-".repeat(86)).append('\n');

            List<Map.Entry<String, PerformanceMetrics.TimingAccumulator>> sorted =
                    new ArrayList<>(steps.entrySet());
            sorted.sort(Comparator.<Map.Entry<String, PerformanceMetrics.TimingAccumulator>>
                    comparingDouble(e -> e.getValue().getTotalMillis()).reversed());

            for (var entry : sorted) {
                String name = entry.getKey();
                var acc = entry.getValue();
                if (name.length() > 50) {
                    name = name.substring(0, 47) + "...";
                }
                sb.append(String.format("  %-50s %8d %14.1f %14.1f%n",
                        name, acc.getCount(),
                        acc.getTotalMillis(), acc.getAverageMillis()));
            }
        }

        sb.append('\n').append(separator).append('\n');
        return sb.toString();
    }
}
