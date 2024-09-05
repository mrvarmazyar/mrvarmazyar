+++
draft = false
date = 2024-09-05T16:20:00+02:00
title = "Effortless Terraform Management: How Terragrunt Keeps Your Code DRY and Efficient"
description = "Explore how Terragrunt helps keep your Terraform code DRY and maintainable by simplifying backend configurations, CLI arguments, and promoting versioned, immutable modules across environments."
slug = "terragrunt-how-to-keep-your-terraform-code-dry-and-maintainable"
authors = ["Mohammad Varmazyar"]
tags = ["Terragrunt", "Terraform", "Infrastructure as Code", "DevOps", "Backend Configuration", "Versioning", "Automation"]
categories = ["DevOps", "Infrastructure as Code", "Terraform", "Terragrunt", "Automation"]
externalLink = ""
series = []
+++

### Terragrunt: How to Keep Your Terraform Code DRY and Maintainable

In 2016, an open-source tool called **Terragrunt** was released to address two key issues with Terraform: (1) the lack of state locking and (2) the inability to configure Terraform state as code. While Terraform has since introduced solutions like backends to handle these problems, new challenges emerged as infrastructure grew more complex. The biggest issue? Keeping your Terraform code DRY (Don’t Repeat Yourself) and easy to maintain across environments.

To tackle this, **Terragrunt v0.19.0** was released, providing compatibility with Terraform 0.12 and HCL2. This version offers several ways to streamline your Terraform workflow. Let's dive into how Terragrunt simplifies your infrastructure management and helps you avoid unnecessary repetition.

### Why You Should Keep Your Terraform Code DRY

If you've ever worked with large Terraform setups, you've likely experienced the frustration of repeating code across environments. Managing backends, CLI arguments, and module configurations can lead to bloated codebases, which are harder to maintain, error-prone, and inefficient. This is where Terragrunt shines — by centralizing configurations, reducing duplication, and promoting best practices for managing infrastructure as code.

#### Keeping Backend Configuration DRY

Terraform's backend feature allows you to store state files in a shared location, such as an S3 bucket, and ensures that state is locked to avoid race conditions. However, one downside is that backend configurations don’t support variables. You’re left having to copy-paste backend code across modules, which introduces a risk of errors and inconsistencies.

For example, here’s a typical backend configuration in Terraform:

```hcl
# stage/frontend-app/main.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "stage/frontend-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "my-lock-table"
  }
}
```

The issue here is that each module — say, one for a database and another for an app — will require a nearly identical backend configuration with slight modifications to the `key` field. This not only leads to duplication but also makes it easy to make a mistake.

Terragrunt addresses this by allowing you to define the backend configuration once in a `terragrunt.hcl` file at the root level, and then reuse it across multiple modules. Here's an example:

```hcl
# stage/terragrunt.hcl
remote_state {
  backend = "s3"
  config = {
    bucket         = "my-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "my-lock-table"
  }
}
```

The `${path_relative_to_include()}` function dynamically generates the path, which means you no longer have to specify the backend for each module manually. This not only keeps your code DRY but also reduces the chances of human error.

#### DRYing Up Terraform CLI Arguments

Another common Terraform challenge is handling CLI arguments, such as passing variable files with the `-var-file` flag. If you're managing multiple environments, remembering which files to include can become tedious and error-prone.

Terragrunt lets you define these arguments in the `terragrunt.hcl` file, so they’re automatically added every time you run a command:

```hcl
# terragrunt.hcl
terraform {
  extra_arguments "common_vars" {
    commands = ["plan", "apply"]
    arguments = [
      "-var-file=../../common.tfvars",
      "-var-file=../region.tfvars"
    ]
  }
}
```

Now, whenever you run `terragrunt apply`, the necessary variable files are automatically included, eliminating the need for manual input:

```bash
$ terragrunt apply
Running command: terraform with arguments [apply -var-file=../../common.tfvars -var-file=../region.tfvars]
```

This saves time, reduces mistakes, and ensures consistency across your Terraform commands.

#### Promoting Immutable, Versioned Terraform Modules Across Environments

One of the most critical lessons learned from managing complex infrastructure is that large, monolithic modules can cause numerous issues. They tend to be slow, difficult to test, hard to review, and risky to update. Instead, breaking your infrastructure into smaller, modular components is the recommended approach.

Here’s an example of how to organize your environments into smaller modules:

```bash
├── prod
│   ├── app
│   │   ├── main.tf
│   │   └── outputs.tf
│   ├── mysql
│   │   ├── main.tf
│   │   └── outputs.tf
│   └── vpc
│       ├── main.tf
│       └── outputs.tf
└── stage
    ├── app
    │   ├── main.tf
    │   └── outputs.tf
    ├── mysql
    │   ├── main.tf
    │   └── outputs.tf
    └── vpc
        ├── main.tf
        └── outputs.tf
```

While this approach keeps your infrastructure modular, it does introduce some code duplication. Each environment has similar `main.tf` and `outputs.tf` files, which can grow redundant. Terragrunt solves this by allowing you to version your Terraform modules and promote those versions across environments.

First, define your reusable modules in a separate Git repository, such as `infrastructure-modules`, and then version them:

```bash
$ git tag -a "v0.0.1" -m "First release of app module"
$ git push --follow-tags
```

In your live environments, you can now reference this versioned module from the repository in your `terragrunt.hcl` files:

```hcl
# prod/app/terragrunt.hcl
terraform {
  source = "github.com:your-org/infrastructure-modules.git//app?ref=v0.0.1"
}
inputs = {
  instance_count = 10
  instance_type  = "m4.large"
}
```

For a `stage` environment, you might reference the same module but with smaller instance sizes to save on costs:

```hcl
# stage/app/terragrunt.hcl
terraform {
  source = "github.com:your-org/infrastructure-modules.git//app?ref=v0.0.1"
}
inputs = {
  instance_count = 3
  instance_type  = "t2.micro"
}
```

With this setup, you maintain a consistent infrastructure codebase while promoting versioned, immutable modules across your environments. If an issue arises in a particular environment, you can easily roll back to a previous version.

### The Value of Terragrunt in Modern Infrastructure Management

Terragrunt isn't just a stopgap solution anymore — it has evolved into a powerful tool for managing Terraform configurations in a DRY, scalable, and maintainable way. By centralizing backend configurations, simplifying CLI arguments, and promoting versioned modules, Terragrunt helps you keep your infrastructure code clean and maintainable.

If you're managing complex Terraform environments, Terragrunt is an essential tool that can help you avoid duplication, reduce errors, and make infrastructure-as-code more efficient.

Why wait? Give Terragrunt a try today and experience the simplicity and power it brings to managing Terraform configurations at scale.

