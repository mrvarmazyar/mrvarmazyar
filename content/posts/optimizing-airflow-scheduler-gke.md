+++ 
draft = false
date = 2024-08-27T11:46:20+02:00
title = "Optimizing Airflow Scheduler on Google Kubernetes Engine: A Cost-Effective Approach"
description = "A detailed guide on optimizing Apache Airflow Scheduler in Google Kubernetes Engine (GKE) to enhance performance and reduce costs."
slug = "optimizing-airflow-scheduler-gke"
authors = ["Mohammad Varmazyar"]
tags = ["Apache Airflow", "GKE", "Kubernetes", "Cloud Engineering"]
categories = ["Cloud Engineering", "DevOps"]
externalLink = ""
series = []
+++

## Introduction

Running hundreds of daily tasks on Apache Airflow is a routine for data-driven companies like StoreMaven. We use Google’s managed Composer environment to streamline our data pipelines. However, as the number of tasks grows, the default Composer setup on Google Kubernetes Engine (GKE) reveals its limitations, particularly when it comes to scaling efficiently and cost-effectively.

In this post, I’ll share our journey of optimizing the Airflow Scheduler on GKE, which led to significant cost savings while maintaining high performance.

## The Default Composer Deployment on GKE

The basic deployment of Composer in GKE is straightforward: a managed GKE cluster is created with three nodes, each running `n1-standard-1` machine types. Airflow worker workloads are distributed across all nodes, while the scheduler, Redis, and other components are deployed randomly on one of these nodes.

However, this setup doesn’t support Vertical Pod Autoscaling (VPA) or Horizontal Pod Autoscaling (HPA) for the default node pool. This means that as your business scales, you’re responsible for manually monitoring and reallocating resources—an inefficient and risky proposition as we discovered.

## The Challenge: Overloading the Airflow Scheduler

As we expanded our usage of Airflow, we noticed that one of our nodes, which hosted the Airflow Scheduler alongside an Airflow worker, was consistently running at over 100% CPU utilization. The scheduler was using around 60% of the available CPU to manage the task queues, leaving little room for the worker to execute tasks efficiently. This caused a spike in CPU usage whenever tasks were kicked off, leading to a potential risk of pod eviction and downtime.

Scaling up the entire node pool with more powerful machines seemed like an obvious solution but would have significantly increased our monthly costs. We needed a smarter, more targeted approach.

## The Solution: Isolating the Scheduler on a Dedicated Node

Instead of upgrading the whole node pool, we opted to create a dedicated node pool for the Airflow Scheduler:

1. **Create a new node pool**: We added a `scheduler-pool` with a single node, specifically tailored to handle the workload of the scheduler. This node type can be adjusted based on your expected workload.

2. **Modify Workloads YAML Files**:
   - **Airflow Scheduler**: We edited the `nodeSelector` in the scheduler’s YAML file to point to the new `scheduler-pool`.
   - **Composer Fluentd Daemon**: We removed the `nodeSelector` to ensure it deploys across all nodes, not just the default pool.

This simple adjustment allowed the Airflow Scheduler to operate in isolation on its dedicated node, resulting in stable CPU utilization of around 70-80% on the scheduler node and freeing up resources on the worker nodes.

## Cost Analysis

By isolating the scheduler, we avoided upgrading our entire cluster to more powerful (and expensive) machines. The cost of adding a single `n1-standard-2` instance for the scheduler was approximately $50 per month. In contrast, upgrading the default pool would have cost an additional $300 per month—an 83.33% cost reduction.

## Conclusion

Optimizing your Airflow Scheduler on GKE doesn’t necessarily require expensive upgrades. By carefully isolating workloads and leveraging the flexibility of Kubernetes, you can achieve significant cost savings while maintaining or even improving performance. This approach not only reduced our operational costs but also enhanced the reliability of our Airflow deployment.

Special thanks to our partners at DoIT International for guiding us through the implementation of this solution.

---

For more insights into optimizing cloud-based environments, follow my blog or connect with me on [LinkedIn](#).
