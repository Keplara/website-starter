# VPC: vpc-087c467583cbe6a78 / MySite-vpc
# arn:aws:ecs:us-east-1:010928192513:cluster/MySite
# Terraform provider configuration
# arn:aws:ecs:us-east-1:010928192513:service/MySite/MySiteClientProduction
# arn:aws:ecs:us-east-1:010928192513:service/MySite/MySiteClientStaging
# test-subnet-private1-us-east-1a
# subnet-0bf018b468ce4a784
# Available
# vpc-0ad7966b0d561f6d7 | test-vpc
# Off
# 10.0.128.0/20
# –
# –
# 4091
# us-east-1a
# use1-az1
# us-east-1
# rtb-0a766e6556d1748dd | test-rtb-private1-us-east-1a
# acl-0532d5edcdda88fa7
# No
# No
# No
# -
# No
<<<<<<< HEAD
# [id]
=======
# 010928192513
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# test-subnet-public1-us-east-1a
# subnet-0b9aaeba8e5c83791
# Available
# vpc-0ad7966b0d561f6d7 | test-vpc
# Off
# 10.0.0.0/20
# –
# –
# 4091
# us-east-1a
# use1-az1
# us-east-1
# rtb-0d3c9ba34d5adb042 | test-rtb-public
# acl-0532d5edcdda88fa7
# No
# No
# No
# -
# No
<<<<<<< HEAD
<<<<<<< HEAD
# [id]
# Mysite-public-production-us-east-1a
# subnet-0b983fb751d2d54f9
# Available
# vpc-087c467583cbe6a78 | Mysite-vpc
=======
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# 010928192513
# MySite-public-production-us-east-1a
# subnet-0b983fb751d2d54f9
# Available
# vpc-087c467583cbe6a78 | MySite-vpc
<<<<<<< HEAD
>>>>>>> 548d3b2 (Added files:)
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# Off
# 172.0.0.0/22
# –
# –
# 1017
# us-east-1a
# use1-az1
# us-east-1
<<<<<<< HEAD
<<<<<<< HEAD
# rtb-05101f4e8285fce81 | Mysite-rtb-public
=======
# rtb-05101f4e8285fce81 | MySite-rtb-public
>>>>>>> 548d3b2 (Added files:)
=======
# rtb-05101f4e8285fce81 | MySite-rtb-public
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# acl-09fab435f999aaaea
# No
# No
# No
# -
# No
<<<<<<< HEAD
<<<<<<< HEAD
# [id]
# Mysite-public-production-us-east-1b
# subnet-0b7534ff3627e1705
# Available
# vpc-087c467583cbe6a78 | Mysite-vpc
=======
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# 010928192513
# MySite-public-production-us-east-1b
# subnet-0b7534ff3627e1705
# Available
# vpc-087c467583cbe6a78 | MySite-vpc
<<<<<<< HEAD
>>>>>>> 548d3b2 (Added files:)
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# Off
# 172.0.16.0/22
# –
# –
# 1018
# us-east-1b
# use1-az2
# us-east-1
<<<<<<< HEAD
<<<<<<< HEAD
# rtb-05101f4e8285fce81 | Mysite-rtb-public
=======
# rtb-05101f4e8285fce81 | MySite-rtb-public
>>>>>>> 548d3b2 (Added files:)
=======
# rtb-05101f4e8285fce81 | MySite-rtb-public
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# acl-09fab435f999aaaea
# No
# No
# No
# -
# No
<<<<<<< HEAD
<<<<<<< HEAD
# [id]
# Mysite-public-staging-us-east-1d
# subnet-07a71a6b51b1fa0a0
# Available
# vpc-087c467583cbe6a78 | Mysite-vpc
=======
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# 010928192513
# MySite-public-staging-us-east-1d
# subnet-07a71a6b51b1fa0a0
# Available
# vpc-087c467583cbe6a78 | MySite-vpc
<<<<<<< HEAD
>>>>>>> 548d3b2 (Added files:)
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# Off
# 172.0.5.0/24
# –
# –
# 250
# us-east-1d
# use1-az6
# us-east-1
<<<<<<< HEAD
<<<<<<< HEAD
# rtb-0512ddc0693b34530 | Mysite-public-staging-rtb
=======
# rtb-0512ddc0693b34530 | MySite-public-staging-rtb
>>>>>>> 548d3b2 (Added files:)
=======
# rtb-0512ddc0693b34530 | MySite-public-staging-rtb
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# acl-09fab435f999aaaea
# No
# No
# No
# -
# No
<<<<<<< HEAD
<<<<<<< HEAD
# [id]
# Mysite-private1-us-east-1a
# subnet-078f46bafc87dff00
# Available
# vpc-087c467583cbe6a78 | Mysite-vpc
=======
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# 010928192513
# MySite-private1-us-east-1a
# subnet-078f46bafc87dff00
# Available
# vpc-087c467583cbe6a78 | MySite-vpc
<<<<<<< HEAD
>>>>>>> 548d3b2 (Added files:)
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
# Off
# 172.0.128.0/22
# –
provider "aws" {
  region = "us-east-1" # Update this to your preferred AWS region

}

resource "aws_ecs_cluster" "my_cluster" {
<<<<<<< HEAD
<<<<<<< HEAD
  name = "Mysite" # Ensure this matches your actual ECS cluster name
=======
  name = "MySite" # Ensure this matches your actual ECS cluster name
>>>>>>> 548d3b2 (Added files:)
  service_connect_defaults {
    namespace = "arn:aws:servicediscovery:us-east-1:[id]:namespace/ns-ys66gqljqhrnedlg"
=======
  name = "MySite" # Ensure this matches your actual ECS cluster name
  service_connect_defaults {
    namespace = "arn:aws:servicediscovery:us-east-1:010928192513:namespace/ns-ys66gqljqhrnedlg"
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
  }
  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_ecs_service" "my_service" {
<<<<<<< HEAD
<<<<<<< HEAD
  name = "MysiteClientProduction"
=======
  name = "MySiteClientProduction"
>>>>>>> 548d3b2 (Added files:)
=======
  name = "MySiteClientProduction"
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842

  availability_zone_rebalancing      = "ENABLED"
  desired_count                      = 1
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  enable_ecs_managed_tags            = true
  health_check_grace_period_seconds  = 30
  enable_execute_command             = false
  iam_role                           = "/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS"
  # launch_type                        = "EC2"
  scheduling_strategy   = "REPLICA"
  wait_for_steady_state = true
<<<<<<< HEAD
<<<<<<< HEAD
  task_definition       = "MysiteClientProduction:17"
  capacity_provider_strategy {
    base              = 0
    capacity_provider = "MysiteCapacityProvider"
=======
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
  task_definition       = "MySiteClientProduction:17"
  capacity_provider_strategy {
    base              = 0
    capacity_provider = "MySiteCapacityProvider"
<<<<<<< HEAD
>>>>>>> 548d3b2 (Added files:)
=======
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
    weight            = 1
  }
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  deployment_controller {
    type = "ECS"
  }
  load_balancer {
    container_name   = "Client"
    container_port   = 80
<<<<<<< HEAD
<<<<<<< HEAD
    target_group_arn = "arn:aws:elasticloadbalancing:us-east-1:[id]:targetgroup/MysiteClientProduction-tg/ae04ea2e63cdbc00"
=======
    target_group_arn = "arn:aws:elasticloadbalancing:us-east-1:010928192513:targetgroup/MySiteClientProduction-tg/ae04ea2e63cdbc00"
>>>>>>> 548d3b2 (Added files:)
=======
    target_group_arn = "arn:aws:elasticloadbalancing:us-east-1:010928192513:targetgroup/MySiteClientProduction-tg/ae04ea2e63cdbc00"
>>>>>>> 047533d2310d240cda3111ee3bf9fefc34944842
  }

  network_configuration {
    assign_public_ip = false
    security_groups  = ["sg-02f2a63c8019a36a6"]
    subnets          = ["subnet-019f35ef077b69198", "subnet-078f46bafc87dff00"]
  }
  ordered_placement_strategy {
    field = "attribute:ecs.availability-zone"
    type  = "spread"
  }
  ordered_placement_strategy {
    field = "instanceId"
    type  = "spread"
  }
}

resource "aws_subnet" "a1" {
  vpc_id = "vpc-087c467583cbe6a78"
  # cidr_block = "10.1.10.0/24"
}
resource "aws_subnet" "b1" {
  vpc_id = "vpc-087c467583cbe6a78"
  cidr_block = "10.1.11.0/24"
}


# variable "subnet_cidr_public" {
#   default = "10.0.1.0/24"
# }
# 
# variable "subnet_cidr_private" {
#   default = "10.0.2.0/24"
# }
# 
# variable "instance_type" {
#   default = "t3.micro"
# }
# 
# # Create Auto Scaling Group
# resource "aws_autoscaling_group" "ecs_asg" {
#   desired_capacity     = 2
#   max_size             = 5
#   min_size             = 1
#   vpc_zone_identifier  = [aws_subnet.public_subnet.id]
#   launch_template {
#     id      = aws_launch_template.ecs_launch_template.id
#     version = "$Latest"
#   }
# 
#   health_check_type          = "EC2"
#   health_check_grace_period = 300
#   wait_for_capacity_timeout   = "0"
#   force_delete               = true
#   tag {
#     key                 = "Name"
#     value               = "ECS Instance"
#     propagate_at_launch = true
#   }
# 
#   # Enabling scaling policies
#   lifecycle {
#     create_before_destroy = true
#   }
# }
# 

# Create public subnet
# resource "aws_subnet" "public_subnet" {
#   vpc_id     = aws_vpc.main_vpc.id
#   cidr_block = var.subnet_cidr_public
#  availability_zone = "us-east-1a" # You can change the AZ as needed
#  map_public_ip_on_launch = true
#  tags = {
#    Name = "public-subnet"
#  }
#}

# # Create private subnet
# resource "aws_subnet" "private_subnet" {
#   vpc_id     = aws_vpc.main_vpc.id
#   cidr_block = var.subnet_cidr_private
#   availability_zone = "us-east-1b" # You can change the AZ as needed
#   tags = {
#     Name = "private-subnet"
#   }
# }

# # Create an Internet Gateway
# resource "aws_internet_gateway" "main_igw" {
#   vpc_id = aws_vpc.main_vpc.id
#   tags = {
#     Name = "main-igw"
#   }
# }

# # Create a security group for ECS tasks
# resource "aws_security_group" "ecs_security_group" {
#   vpc_id = aws_vpc.main_vpc.id
# 
#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# 
#   ingress {
#     from_port   = 80
#     to_port     = 80
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# 
#   tags = {
#     Name = "ecs-sg"
#   }
# }
# 

# # Create an ECS task definition (assuming you have a Docker image in ECR)
# resource "aws_ecs_task_definition" "main_task" {
#   family                   = "main-task"
#   network_mode             = "awsvpc"
#   requires_compatibilities = ["NO FARGATE"]
# 
#   container_definitions = jsonencode([{
#     name      = "main-app"
#     image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest" # Replace with your ECR image
#     cpu       = 256
#     memory    = 512
#     essential = true
#     portMappings = [
#       {
#         containerPort = 80
#         hostPort      = 80
#         protocol      = "tcp"
#       }
#     ]
#   }])
# 
#   tags = {
#     Name = "main-task"
#   }
# }
# 
# # Create an ECS service 
# resource "aws_ecs_service" "main_service" {
#   name            = "main-service"
#   cluster         = aws_ecs_cluster.main_cluster.id
#   task_definition = aws_ecs_task_definition.main_task.arn
#   desired_count   = 1
#   launch_type     = "FARGATE"
#   network_configuration {
#     subnets          = [aws_subnet.public_subnet.id]
#     security_groups = [aws_security_group.ecs_security_group.id]
#     assign_public_ip = true
#   }
# 
#   tags = {
#     Name = "main-service"
#   }
# }
# 
# Create a Load Balancer
# resource "aws_lb" "main_lb" {
#   name               = "main-lb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.ecs_security_group.id]
#   subnets            = [aws_subnet.public_subnet.id]

#   # enable_deletion_protection = false
#   # idle_timeout {
#   #   minutes = 4
#   # }

#   tags = {
#     Name = "main-lb"
#   }
# }

# Create a Load Balancer listener
# resource "aws_lb_listener" "main_listener" {
#   load_balancer_arn = aws_lb.main_lb.arn
#   port              = "80"
#   protocol          = "HTTP"

#   default_action {
#     type             = "fixed-response"
#     fixed_response {
#       status_code = 200
#       message_body = "Hello, world!"
#     }
#   }
# }

# Connect ECS service to the load balancer
# resource "aws_lb_target_group" "main_target_group" {
#   name        = "main-tg"
#   port        = 80
#   protocol    = "HTTP"
#   vpc_id      = aws_vpc.main_vpc.id
#   target_type = "ip"
# }

# resource "aws_lb_listener_rule" "ecs_service_listener" {
#   listener_arn = aws_lb_listener.main_listener.arn

#   action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.main_target_group.arn
#   }

#   condition {
#     field  = "path-pattern"
#     values = ["/"]
#   }
# }