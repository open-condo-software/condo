export const getAppTemplate = (appName: string, secretFilename: string) => {
    return `
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}-${appName}-app
  labels:
    service: {{ .Chart.Name }}-${appName}-app
spec:
  replicas: {{ pluck .Values.werf.env .Values.${appName}.app.replicas | first | default .Values.${appName}.app.replicas._default }}
  selector:
    matchLabels:
      service: {{ .Chart.Name }}-${appName}-app
  template:
    metadata:
      labels:
        service: {{ .Chart.Name }}-${appName}-app
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/${secretFilename}") . | sha256sum }}
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
        image: {{ .Values.werf.image.${appName} }}
        workingDir: /app
        resources:
          requests:
            cpu: {{ pluck .Values.werf.env .Values.${appName}.app.requests.cpu | first | default .Values.${appName}.app.requests.cpu._default | quote }}
            memory: {{ pluck .Values.werf.env .Values.${appName}.app.requests.memory | first | default .Values.${appName}.app.requests.memory._default | quote }}
          limits:
            memory: {{ pluck .Values.werf.env .Values.${appName}.app.requests.memory | first | default .Values.${appName}.app.requests.memory._default | quote }}
        command: ['yarn', 'workspace', '@app/${appName}', 'start']
        ports:
        - containerPort: {{ pluck .Values.werf.env .Values.${appName}.app.port | first | default .Values.${appName}.app.port._default }}
          name: app
          protocol: TCP
        envFrom:
        - secretRef:
            name: ${appName}-secrets
        {{- if hasPrefix "review" .Values.werf.env }}
        - secretRef:
            name: ${appName}-review-secrets
        {{- end }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .Chart.Name }}-${appName}
spec:
  type: ClusterIP
  selector:
    service: {{ .Chart.Name }}-${appName}-app
  ports:
    - name: {{ .Chart.Name }}-${appName}-app
      port: {{ pluck .Values.werf.env .Values.${appName}.app.port | first | default .Values.${appName}.app.port._default }}
      protocol: TCP
      targetPort: {{ pluck .Values.werf.env .Values.${appName}.app.port | first | default .Values.${appName}.app.port._default }}
`
}


export const getSecretsTemplate = (appName: string) => {
    return `
---
apiVersion: v1
kind: Secret
metadata:
  name: ${appName}-secrets
  annotations:
    "helm.sh/hook": pre-install, pre-upgrade
    "helm.sh/hook-weight": "0"
type: Opaque
data:
{{- include "services_urls" . | indent 2 }}
{{- range $env, $val := .Values.envs.${appName} }}
  {{ $env | upper }}: {{ pluck $.Values.werf.env $val | first | default $val._default | b64enc }}
{{- end }}
---
{{- if hasPrefix "review" .Values.werf.env }}
apiVersion: v1
kind: Secret
metadata:
  name: ${appName}-review-secrets
  annotations:
    "helm.sh/hook": pre-install, pre-upgrade
    "helm.sh/hook-weight": "0"
type: Opaque
data:
  DATABASE_URL: {{ printf "postgresql://%s:%s@%s:5432/%s_review_${appName}" .Values.review.pg_${appName}._default .Values.review.pg_${appName}._default .Values.review_env.src_db_ip._default .Values.global.ci_url_prefix | b64enc }}
{{- end }}`
}

export const getWorkerTemplate = (appName: string, secretFilename: string) => {
    return `
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}-${appName}-worker
  labels:
    service: {{ .Chart.Name }}-${appName}-worker
spec:
  replicas: {{ pluck .Values.werf.env .Values.${appName}.worker.replicas | first | default .Values.${appName}.worker.replicas._default }}
  selector:
    matchLabels:
      service: {{ .Chart.Name }}-${appName}-worker
  template:
    metadata:
      labels:
        service: {{ .Chart.Name }}-${appName}-worker
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/${secretFilename}") . | sha256sum }}
    spec:
      nodeSelector:
        nodepool: application-node-pool
      imagePullSecrets:
        - name: {{ required ".Values.registry.secret_name" .Values.registry.secret_name }}
      containers:
        - name: ${appName}-worker
          image: {{ .Values.werf.image.${appName} }}
          workingDir: /app
          resources:
            requests:
              cpu: {{ pluck .Values.werf.env .Values.${appName}.worker.requests.cpu | first | default .Values.${appName}.worker.requests.cpu._default | quote }}
              memory: {{ pluck .Values.werf.env .Values.${appName}.worker.requests.memory | first | default .Values.${appName}.worker.requests.memory._default | quote }}
            limits:
              memory: {{ pluck .Values.werf.env .Values.${appName}.worker.requests.memory | first | default .Values.${appName}.worker.requests.memory._default | quote }}
          command: ['yarn', 'workspace', '@app/${appName}', 'worker']
          ports:
            - containerPort: {{ pluck .Values.werf.env .Values.${appName}.worker.port | first | default .Values.${appName}.worker.port._default }}
              name: worker
              protocol: TCP
          envFrom:
            - secretRef:
                name: ${appName}-secrets
            {{- if hasPrefix "review" .Values.werf.env }}
            - secretRef:
                name: ${appName}-review-secrets
            {{- end }}
`
}

export const getMigrationsTemplate = (appName: string, secretFilename: string) => {
    return `
---
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ printf "%s-${appName}-migrations-%s" .Chart.Name (now | date "2006-01-02-15-04-05")}}
  labels:
    app: {{ printf "%s-${appName}-migrations" .Chart.Name }}
  annotations:
    "helm.sh/hook": pre-install, pre-upgrade
    "helm.sh/hook-weight": "2"
spec:
  ttlSecondsAfterFinished: 100
  template:
    metadata:
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/${secretFilename}") . | sha256sum }}
    spec:
      nodeSelector:
        nodepool: application-node-pool
      imagePullSecrets:
        - name: {{ required ".Values.registry.secret_name" .Values.registry.secret_name }}
      restartPolicy: Never
      containers:
      - name: migrate-${appName}-app
        image: {{ .Values.werf.image.${appName} }}
        command: ['yarn', 'workspace', '@app/${appName}', 'migrate']
        workingDir: /app
        envFrom:
        - secretRef:
            name: ${appName}-secrets
        {{- if hasPrefix "review" .Values.werf.env }}
        - secretRef:
            name: ${appName}-review-secrets
        {{- end }}`
}


export const getIngressTemplate = (appName: string) => {
    return `
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Chart.Name }}-${appName}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; preload";
      more_set_headers "X-Request-Id: $request_id";
spec:
  tls:
  - hosts:
    - {{ .Values.global.ci_${appName}_url }}
    secretName: {{ if hasPrefix "production" .Values.werf.env }}doma-wildcard{{ else if hasPrefix "review" .Values.werf.env }}review-wildcard{{ else }}doma-development-wildcard{{ end }}
  rules:
  - host: {{ .Values.global.ci_${appName}_url }}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Chart.Name }}-${appName}
            port:
              number: {{ pluck .Values.werf.env .Values.${appName}.app.port | first | default .Values.${appName}.app.port._default }}`
}