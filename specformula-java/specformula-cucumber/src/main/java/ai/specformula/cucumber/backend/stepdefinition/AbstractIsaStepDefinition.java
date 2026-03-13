package ai.specformula.cucumber.backend.stepdefinition;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.core.backend.CucumberBackendException;
import io.cucumber.core.backend.CucumberInvocationTargetException;
import io.cucumber.core.backend.ParameterInfo;
import io.cucumber.core.backend.StepDefinition;
import io.cucumber.core.backend.TypeResolver;
import io.cucumber.datatable.DataTable;
import io.cucumber.docstring.DocString;

/**
 * ISA StepDefinition 的抽象基類。 每種 instruction_type 對應一個具體子類，負責定義各自的執行邏輯骨架。
 */
public abstract class AbstractIsaStepDefinition implements StepDefinition {

    private static final String TYPE_TIME_CONTROL = "time_control";
    private static final String DATA_FORMAT_JSON = "json";

    protected final IsaInstruction instruction;
    protected final ISAFeatureArgumentResolver resolver;
    private final List<ParameterInfo> parameterInfos;

    protected AbstractIsaStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver) {
        this.instruction = instruction;
        this.resolver = resolver;
        this.parameterInfos = buildParameterInfos(instruction);
    }

    /**
     * 根據 instruction_type 和 data_format 建構 parameterInfos。 parameterInfos
     * 必須包含所有參數：regex capturing groups (String) + DataTable/DocString。 Cucumber
     * 用 parameterInfos.size() 做參數數量驗證， 用最後一個元素的 TypeResolver 決定
     * DataTable/DocString 的轉換方式。
     *
     * - time_control: 只有 regex capturing groups，不帶 DataTable/DocString - 其他
     * instruction_type: regex capturing groups + 依 data_format 決定最後參數 -
     * data_format=json → DocString - 預設（含 data_table）→ DataTable
     */
    private static List<ParameterInfo> buildParameterInfos(IsaInstruction instruction) {
        int groupCount = countCapturingGroups(instruction.getFormat());
        String type = instruction.getInstructionType();

        List<ParameterInfo> infos = new ArrayList<>();
        // regex capturing groups 對應 String 型別參數
        for (int i = 0; i < groupCount; i++) {
            infos.add(new SimpleParameterInfo(String.class));
        }

        if (!TYPE_TIME_CONTROL.equals(type)) {
            String dataFormat = instruction.getDataFormat();
            Type lastParamType = DATA_FORMAT_JSON.equals(dataFormat) ? DocString.class : DataTable.class;
            infos.add(new SimpleParameterInfo(lastParamType));
        }

        return List.copyOf(infos);
    }

    /**
     * 計算 regex format 中 capturing group 的數量（排除 non-capturing group (?:...)）。 透過
     * Pattern.compile 取得 groupCount，最為準確。
     */
    private static int countCapturingGroups(String format) {
        // 先做與 getPattern() 相同的轉換，才能正確 compile
        String pattern = format;
        pattern = pattern.replaceAll("\\(\\?P<[^>]+>", "(");
        pattern = pattern.replaceAll("\\(\\?<[^>]+>", "(");
        return Pattern.compile(pattern).matcher("").groupCount();
    }

    @Override
    public void execute(Object[] args)
            throws CucumberBackendException, CucumberInvocationTargetException {
        try {
            doExecute(args);
        } catch (AssertionError | Exception e) {
            // AssertionError → Cucumber 歸為 Failure（驗證失敗）
            throw new CucumberInvocationTargetException(
                    this, new InvocationTargetException(e));
        }
    }

    /**
     * 子類實作具體的執行邏輯。
     */
    protected abstract void doExecute(Object[] args) throws Exception;

    @Override
    public String getPattern() {
        String pattern = instruction.getFormat();
        // 將 Python 風格 named group (?P<name>...) 轉換為普通 capturing group
        // Java regex named group 不支援底線，且 Cucumber 傳入 args 時以位置順序為主，
        // 因此直接移除 named group 名稱，保留 capturing group 即可
        pattern = pattern.replaceAll("\\(\\?P<[^>]+>", "(");
        // 同樣移除 Java 風格 named group (?<name>...)
        pattern = pattern.replaceAll("\\(\\?<[^>]+>", "(");
        // Cucumber 7 ExpressionFactory 以 /regex/ 格式識別 RegularExpression，
        // 將 ^...$ anchor 轉換為 /.../ 包裹格式
        if (pattern.startsWith("^") && pattern.endsWith("$")) {
            pattern = "/" + pattern.substring(1, pattern.length() - 1) + "/";
        }
        return pattern;
    }

    @Override
    public List<ParameterInfo> parameterInfos() {
        return parameterInfos;
    }

    @Override
    public boolean isDefinedAt(StackTraceElement stackTraceElement) {
        return false;
    }

    @Override
    public String getLocation() {
        return instruction.getName() + " [" + instruction.getInstructionType() + "]";
    }

    public IsaInstruction getInstruction() {
        return instruction;
    }

    /**
     * 簡易的 ParameterInfo 實作，用於告知 Cucumber 最後一個參數的型別。
     */
    private static class SimpleParameterInfo implements ParameterInfo {

        private final Type type;

        SimpleParameterInfo(Type type) {
            this.type = type;
        }

        @Override
        public Type getType() {
            return type;
        }

        @Override
        public boolean isTransposed() {
            return false;
        }

        @Override
        public TypeResolver getTypeResolver() {
            return () -> type;
        }
    }
}
