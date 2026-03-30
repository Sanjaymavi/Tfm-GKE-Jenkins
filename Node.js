env:
- name: OTEL_SERVICE_NAME
  value: node-app
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: http://alloy:4317
- name: OTEL_TRACES_EXPORTER
  value: otlp
