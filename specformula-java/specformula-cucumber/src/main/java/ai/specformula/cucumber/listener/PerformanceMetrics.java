package ai.specformula.cucumber.listener;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

/**
 * Thread-safe 效能指標收集器（靜態 singleton）。
 * <p>
 * Cucumber plugin 與 Backend 分別實例化，透過此 singleton 共用指標資料。
 * </p>
 */
public final class PerformanceMetrics {

    private static final PerformanceMetrics INSTANCE = new PerformanceMetrics();

    public static PerformanceMetrics getInstance() {
        return INSTANCE;
    }

    /**
     * Lock-free 累加器：記錄總耗時與呼叫次數。
     */
    public static final class TimingAccumulator {
        private final LongAdder totalNanos = new LongAdder();
        private final LongAdder count = new LongAdder();

        public void record(long nanos) {
            totalNanos.add(nanos);
            count.increment();
        }

        public long getCount() {
            return count.sum();
        }

        public double getTotalMillis() {
            return totalNanos.sum() / 1_000_000.0;
        }

        public double getAverageMillis() {
            long c = count.sum();
            return c == 0 ? 0.0 : getTotalMillis() / c;
        }
    }

    /** Step definition metrics — key = code location（例如 "Data preparation [entity_setup]"） */
    private final Map<String, TimingAccumulator> stepMetrics = new ConcurrentHashMap<>();

    /** Backend phase metrics — key = phase name（loadGlue / buildWorld / disposeWorld） */
    private final Map<String, TimingAccumulator> phaseMetrics = new ConcurrentHashMap<>();

    private PerformanceMetrics() {}

    public void recordStep(String location, long durationNanos) {
        stepMetrics.computeIfAbsent(location, k -> new TimingAccumulator())
                   .record(durationNanos);
    }

    public void recordPhase(String phaseName, long durationNanos) {
        phaseMetrics.computeIfAbsent(phaseName, k -> new TimingAccumulator())
                    .record(durationNanos);
    }

    public Map<String, TimingAccumulator> getStepMetrics() {
        return stepMetrics;
    }

    public Map<String, TimingAccumulator> getPhaseMetrics() {
        return phaseMetrics;
    }
}
