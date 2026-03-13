package stepdefs

// splitPath splits a dot-notation path into keys
func splitPath(path string) []string {
	result := []string{}
	current := ""
	for _, char := range path {
		if char == '.' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

// setNestedField sets a nested field in a map using dot notation (e.g., "user.name")
func setNestedField(m map[string]interface{}, path string, value interface{}) {
	keys := splitPath(path)
	for i := 0; i < len(keys)-1; i++ {
		key := keys[i]
		if _, ok := m[key]; !ok {
			m[key] = make(map[string]interface{})
		}
		if nested, ok := m[key].(map[string]interface{}); ok {
			m = nested
		} else {
			return
		}
	}
	m[keys[len(keys)-1]] = value
}