import path from 'path'

import { CONDO_ROOT } from '@cli/consts'

export const HELM_DIR = path.resolve(CONDO_ROOT, './.helm')
export const TEMPLATES_DIR = path.join(HELM_DIR, 'templates')
export const REVIEW_DIR = path.join(TEMPLATES_DIR, 'review')
export const SERVICES_URLS = path.join(TEMPLATES_DIR, '000-services-urls.yaml')

// @ts-nocheck
// This entire block will now be ignored by TypeScript's type checker.
export const HELM_TEMPLATES = {
    app: `\${REVIEW_NE_WRAPPER_START}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}-\${APP}-app
  labels:
    service: {{ .Chart.Name }}-\${APP}-app
spec:
  replicas: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.replicas | first | default .Values.\${APP_UNDERSCORE}.app.replicas._default }}
  selector:
    matchLabels:
      service: {{ .Chart.Name }}-\${APP}-app
  template:
    metadata:
      labels:
        service: {{ .Chart.Name }}-\${APP}-app
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/271-\${APP}-secret.yaml") . | sha256sum }}
    spec:
      nodeSelector:
        nodepool: application-node-pool
      imagePullSecrets:
        - name: {{ required ".Values.registry.secret_name" .Values.registry.secret_name }}
      securityContext:
        fsGroup: 999
        runAsUser: 999
      containers:
      - name: app
        image: {{ .Values.werf.image.\${APP_UNDERSCORE} }}
        workingDir: /app
        resources:
          requests:
            cpu: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.requests.cpu | first | default .Values.\${APP_UNDERSCORE}.app.requests.cpu._default | quote }}
            memory: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.requests.memory | first | default .Values.\${APP_UNDERSCORE}.app.requests.memory._default | quote }}
          limits:
            memory: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.requests.memory | first | default .Values.\${APP_UNDERSCORE}.app.requests.memory._default | quote }}
        command: ['yarn', 'workspace', '@app/\${APP}', 'start']
        ports:
        - containerPort: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.port | first | default .Values.\${APP_UNDERSCORE}.app.port._default }}
          name: app
          protocol: TCP
        envFrom:
        - secretRef:
            name: \${APP}-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .Chart.Name }}-\${APP}
spec:
  type: ClusterIP
  selector:
    service: {{ .Chart.Name }}-\${APP}-app
  ports:
    - name: {{ .Chart.Name }}-\${APP}-app
      port: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.port | first | default .Values.\${APP_UNDERSCORE}.app.port._default }}
      protocol: TCP
      targetPort: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.port | first | default .Values.\${APP_UNDERSCORE}.app.port._default }}
\${REVIEW_NE_WRAPPER_END}`,

    secrets: `\${REVIEW_NE_WRAPPER_START}
---
apiVersion: v1
kind: Secret
metadata:
  name: \${APP}-secrets
  annotations:
    "helm.sh/hook": pre-install, pre-upgrade
    "helm.sh/hook-weight": "0"
type: Opaque
data:
{{- include "services_urls" . | indent 2 }}
{{- range $env, $val := .Values.envs.\${APP_UNDERSCORE} }}
{{- if and (eq $.Values.werf.env "review") (eq $env "server_url") }}
  {{ $env | upper }}: {{ ( printf "https://%s"  $.Values.global.ci_\${APP_UNDERSCORE}_url ) | b64enc }}
{{- else }}
  {{ $env | upper }}: {{ pluck $.Values.werf.env $val | first | default $val._default | b64enc }}
{{- end }}
{{- end }}
\${REVIEW_NE_WRAPPER_END}`,

    worker: `\${REVIEW_NE_WRAPPER_START}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}-\${APP}-worker
  labels:
    service: {{ .Chart.Name }}-\${APP}-worker
spec:
  replicas: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.worker.replicas | first | default .Values.\${APP_UNDERSCORE}.worker.replicas._default }}
  selector:
    matchLabels:
      service: {{ .Chart.Name }}-\${APP}-worker
  template:
    metadata:
      labels:
        service: {{ .Chart.Name }}-\${APP}-worker
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/271-\${APP}-secret.yaml") . | sha256sum }}
    spec:
      nodeSelector:
        nodepool: application-node-pool
      imagePullSecrets:
        - name: {{ required ".Values.registry.secret_name" .Values.registry.secret_name }}
      containers:
        - name: \${APP}-worker
          image: {{ .Values.werf.image.\${APP_UNDERSCORE} }}
          workingDir: /app
          resources:
            requests:
              cpu: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.worker.requests.cpu | first | default .Values.\${APP_UNDERSCORE}.worker.requests.cpu._default | quote }}
              memory: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.worker.requests.memory | first | default .Values.\${APP_UNDERSCORE}.worker.requests.memory._default | quote }}
            limits:
              memory: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.worker.requests.memory | first | default .Values.\${APP_UNDERSCORE}.worker.requests.memory._default | quote }}
          command: ['yarn', 'workspace', '@app/\${APP}', 'worker']
          ports:
            - containerPort: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.worker.port | first | default .Values.\${APP_UNDERSCORE}.worker.port._default }}
              name: worker
              protocol: TCP
          envFrom:
            - secretRef:
                name: \${APP}-secrets
\${REVIEW_NE_WRAPPER_END}`,

    migrations: `\${REVIEW_NE_WRAPPER_START}
---
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ printf "%s-\${APP}-migrations-%s" .Chart.Name (now | date "2006-01-02-15-04-05")}}
  labels:
    app: {{ printf "%s-\${APP}-migrations" .Chart.Name }}
  annotations:
    "helm.sh/hook": pre-install, pre-upgrade
    "helm.sh/hook-weight": "2"
spec:
  ttlSecondsAfterFinished: 100
  template:
    metadata:
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/271-\${APP}-secret.yaml") . | sha256sum }}
    spec:
      nodeSelector:
        nodepool: application-node-pool
      imagePullSecrets:
        - name: {{ required ".Values.registry.secret_name" .Values.registry.secret_name }}
      restartPolicy: Never
      containers:
      - name: migrate-condo-\${APP}-app
        image: {{ .Values.werf.image.\${APP_UNDERSCORE} }}
        command: ['yarn', 'workspace', '@app/\${APP}', 'migrate']
        workingDir: /app
        envFrom:
        - secretRef:
            name: \${APP}-secrets

\${REVIEW_NE_WRAPPER_END}`,

    ingress: `\${REVIEW_NE_WRAPPER_START}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Chart.Name }}-\${APP}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; preload";
      more_set_headers "X-Request-Id: $request_id";
spec:
  tls:
  - hosts:
    - {{ .Values.global.ci_\${APP_UNDERSCORE}_url }}
    secretName: {{ if hasPrefix "production" .Values.werf.env }}doma-wildcard{{ else }}doma-development-wildcard{{ end }}
  rules:
  - host: {{ .Values.global.ci_\${APP_UNDERSCORE}_url }}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Chart.Name }}-\${APP}
            port:
              number: {{ pluck .Values.werf.env .Values.\${APP_UNDERSCORE}.app.port | first | default .Values.\${APP_UNDERSCORE}.app.port._default }}
\${REVIEW_NE_WRAPPER_END}`,
}
